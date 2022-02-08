// read/write values for device availability calculations, where

// availability = time machine is active / time machine is available for use.
// active = part_count changed in previous time period.
// available = current time is within the schedule for the machine.

// in client's setup.yaml, need something like this (eg see client-oxbox) -
// metrics:
// - name: availability
//   activePath: controller/partOccurrence/part_count-all
//   startPath: processes/process_time-start
//   stopPath: processes/process_time-complete

// name = availability will cause this js plugin to be loaded.
// then this code uses the given paths to look in the database for
// activity and schedule information.
// it then writes out the availability metric for each minute, hour, day, etc.

// each minute will have a value 0 or 1, because we have to choose some
// unit of time to look at the activity of a machine to say if it was 'active'
// or not, and a minute seems like a good unit for these big machines.
//. (or could pass base time unit in setup yaml)
// and if it's active, it will also increment the current hour, day,
// month, year bins.
// this lets us look at the timeline at different resolutions in the dashboard.

// if the current time is within the machine's schedule, it will similarly
// increment the minute, hour, day, etc bins for 'available'.

// to calculate the 'availability' percentage, the metrics view in the db
// does 'active' / 'available'.

const minutes = 60 * 1000 // 60 ms
const hours = 60 * minutes
const days = 24 * hours

const backfillDefaultStart = 60 * days // ie look this far back for first backfill date, by default
const metricIntervalDefault = 60 // seconds
const resolutions = 'minute,hour,day,week,month,year'.split(',') //. 5min? 15min?

export class Metric {
  constructor() {
    this.device = null
    this.metric = null
    this.db = null
    this.interval = null
    this.timer = null
  }

  async start({ client, db, device, metric }) {
    console.log(`Meter - initialize availability metric...`)
    this.client = client
    this.db = db
    this.device = device
    this.metric = metric

    this.timezoneOffset = client.timezoneOffsetHrs * hours // ms

    console.log(`Meter - get device node_id...`)
    this.device.node_id = await this.getDeviceId() // repeats until device is there
    console.log(this.device)

    //. poll for schedule info, save to this - set up timer for every 10mins?
    // pollSchedule vs pollMetrics?

    // get polling interval - either from metric in setup yaml or default value
    this.interval = (metric.interval || metricIntervalDefault) * 1000 // ms

    await this.backfill() // backfill missing values
    await this.poll() // do first poll
    this.timer = setInterval(this.poll.bind(this), this.interval) // poll db
  }

  // get device node_id associated with a device name.
  // waits until it's there, in case this is run during setup.
  async getDeviceId() {
    let result
    while (true) {
      const sql = `select node_id from devices where name='${this.device.name}'`
      result = await this.db.query(sql)
      if (result.rows.length > 0) break
      await new Promise(resolve => setTimeout(resolve, 4000)) // wait 4 secs
    }
    return result.rows[0].node_id
  }

  async backfill() {
    console.log(`Meter - backfilling any missed dates...`)

    const now = new Date()
    const defaultStart = new Date(now.getTime() - backfillDefaultStart) // eg 60d ago

    // get starting point by finding most recent record in bins
    const sql = `
      select time 
      from bins 
      where device_id=${this.device.node_id} 
      order by time desc 
      limit 1;
    `
    const result = await this.db.query(sql)
    const lastRead = result.rows.length > 0 && result.rows[0].time
    console.log(`lastRead`, lastRead)
    const startBackfill = lastRead ? new Date(lastRead) : defaultStart
    console.log(`startBackfill`, startBackfill)

    // get list of start/stop times since then, in order
    const sql2 = `
      select time, path, value
      from history_all
      where
        device = '${this.device.name}'
        and path in ('${this.metric.startPath}', '${this.metric.stopPath}')
        and time >= '${startBackfill.toISOString()}'
      order by time asc;
    `
    const result2 = await this.db.query(sql2)

    // loop over start/stop times, add to a dict
    // row.value is sthing like '2022-01-27T05:00:00' with NO Z -
    // ie it's 'local' time, which can only be interpreted correctly by
    // knowing the client's timezone. so need to subtract that offset
    const startStopTimes = {}
    for (let row of result2.rows) {
      const localTime = row.value
      const time = new Date(localTime).getTime() - this.timezoneOffset
      if (!isNaN(time)) {
        const minute = Math.floor(time / minutes)
        startStopTimes[minute] = row.path
      }
    }
    console.log('dict', startStopTimes)

    // loop from startstart to now, interval 1 min
    // check for active and available
    // write to bins table those values
    const startMinute = Math.floor(startBackfill.getTime() / minutes)
    const nowMinute = Math.floor(now.getTime() / minutes)
    console.log(`start, now`, startMinute, nowMinute)
    let state = null
    for (let minute = startMinute; minute < nowMinute; minute++) {
      const path = startStopTimes[minute]
      if (path === this.metric.startPath) {
        state = 1
      } else if (path === this.metric.stopPath) {
        state = 0
      }
      if (state) {
        const time = new Date(minute * minutes)
        await this.updateBins(time, this.interval)
      }
    }
    console.log(`Backfill done`)
  }

  // poll db and update bins - called by timer
  async poll() {
    console.log('Meter - poll db and update bins')
    const now = new Date()
    // shift now into server timezone (GMT) so can do comparisons properly
    // const now = new Date(
    //   new Date().getTime() +
    //     (this.client.timezoneOffsetHrs || 0) * 60 * 60 * 1000
    // )
    console.log('Meter - now', now)

    // get schedule for device, eg { start: '2022-01-13 05:00:00', stop: ... }
    console.log(`Meter - get schedule...`)

    //. do this every 10mins or so on separate timer, save to this
    const schedule = await this.getSchedule()

    // check if we're within scheduled time
    const scheduled = now >= schedule.start && now <= schedule.stop
    if (scheduled) {
      console.log(`Meter - in scheduled time window - updatebins...`)
      await this.updateBins(now, this.interval)
    } else {
      console.log(`Meter - not in scheduled time window`)
    }
  }

  async updateBins(now, interval) {
    // check for events in previous n secs, eg 60
    console.log(`Meter - check if device was active`)
    const start = new Date(now.getTime() - interval)
    const stop = now
    const deviceWasActive = await this.getActive(start, stop)
    // if device was active, increment the active bin
    if (deviceWasActive) {
      console.log(`Meter - device was active, increment active bin`)
      await this.incrementBins(now, 'active')
    }
    // always increment the available bin
    console.log(`Meter - always increment the available bin`)
    await this.incrementBins(now, 'available')
  }

  // query db for start and stop datetime dataitems.
  // converts the timestrings to local time for the client.
  //. will want to pass an optional datetime for the date to search for.
  async getSchedule() {
    const table = 'history_text'
    const device = this.device
    const client = this.client
    const { startPath, stopPath } = this.metric
    // note: these can return 'UNAVAILABLE' or 'HOLIDAY', in which case,
    // schedule.start etc will be 'Invalid Date'.
    // any comparison with those will yield false.
    //.. search for a given date, not latest value
    const start = await this.db.getLatestValue(table, device, startPath)
    const stop = await this.db.getLatestValue(table, device, stopPath)
    // shift these by client timezoneOffsetHrs, as need them for comparisons
    const schedule = {
      start: new Date(
        new Date(start).getTime() - client.timezoneOffsetHrs * 60 * 60 * 1000
      ),
      stop: new Date(
        new Date(stop).getTime() - client.timezoneOffsetHrs * 60 * 60 * 1000
      ),
    }
    console.log('schedule', schedule)
    return schedule
  }

  // check if device was 'active' (ie has events on the active path), between two times.
  // returns true/false
  async getActive(start, stop) {
    console.log(`Meter - check if device was active between`, start, stop)
    const sql = `
      select count(value) > 0 as active
      -- just look at _float, not _all - _all includes "0"'s, which don't get plotted
      -- on the partcount graph, but can affect the availability score - so it
      -- looks like the availability has some spurious value. 
      -- from history_all
      from history_float
      where
        device = '${this.device.name}'
        and path = '${this.metric.activePath}'
        and time between '${start.toISOString()}' and '${stop.toISOString()}'
      limit 1;
    `
    const result = await this.db.query(sql)
    const deviceWasActive = result.rows[0].active // t/f
    return deviceWasActive
  }

  // increment values in the bins table.
  // rounds the given time down to nearest min, hour, day, week etc,
  // and increments the given field for each.
  // field is eg 'active', 'available'.
  //. what timezone is time in? what about timeISO?
  async incrementBins(time, field, delta = 1) {
    const timeISO = time.toISOString()
    for (let resolution of resolutions) {
      // upsert/increment the given field by delta
      const sql = `
        insert into bins (device_id, resolution, time, ${field})
          values (
            ${this.device.node_id},
            ('1 '||'${resolution}')::interval,
            date_trunc('${resolution}', '${timeISO}'::timestamptz),
            ${delta}
          )
        on conflict (device_id, resolution, time) do
          update set ${field} = coalesce(bins.${field}, 0) + ${delta};
      `
      // console.log(sql)
      await this.db.query(sql)
    }
  }
}
