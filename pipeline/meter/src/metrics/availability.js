// read/write values for device availability calculations

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

    console.log(`Meter - get device node_id...`)
    this.device.node_id = await this.getDeviceId() // repeats until device is there
    console.log(this.device)

    //. poll for schedule info, save to this - set up timer for every 10mins?
    // pollSchedule? vs pollMetrics or poll?

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

    //. get starting point by finding most recent record in bins
    const sql = `
      select time 
      from bins 
      where device_id=${this.device.node_id} order by time desc limit 1;
    `
    const result = await this.db.query(sql)
    let lastRead = null
    if (result.rows.length > 0) {
      lastRead = result.rows[0].time
    }
    console.log(lastRead)
    const start = lastRead ? new Date(lastRead) : defaultStart
    const nminutes = Math.floor((now.getTime() - start.getTime()) / minutes)
    console.log(`Meter - start and nminutes`, start, nminutes)

    //. get list of start/stop times since then, in order
    const sql2 = `
      select time, path, value
      from history_all
      where
        device = '${this.device.name}'
        and path in ('${this.metric.startPath}', '${this.metric.stopPath}')
        and time >= '${start.toISOString()}';
    `
    const result2 = await this.db.query(sql2)

    // loop over start/stop times, add to a dict
    const startStopTimes = {}
    for (let row of result.rows) {
      const time = new Date(row.value).getTime()
      if (!isNaN(time)) {
        const minute = Math.floor(time / minutes)
        startStopTimes[minute] = row.path
      }
    }
    console.log(startStopTimes)

    //. loop from startstart to now, interval 1 min
    //  check for active and available
    //. write to bins table those values
    // for (let minute = 0; minute < nminutes; minute++) {
    const startMinute = Math.floor(start.getTime() / minutes)
    const nowMinute = Math.floor(now.getTime() / minutes)
    for (let minute = startMinute; minute < nowMinute; minute++) {
      const foo = startStopTimes[minute]
      console.log(foo)
    }
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
      console.log(`Meter - in scheduled time window - check if active...`)
      // if so, check for events in previous n secs, eg 60
      const start = new Date(now.getTime() - this.interval)
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
    } else {
      console.log(`Meter - not in scheduled time window`)
    }
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

  // // backfill the active and available field bins
  // async backfill() {
  //   //
  // }

  // check if device was 'active' (ie has events on the active path), between two times.
  // returns true/false
  async getActive(start, stop) {
    const sql = `
      select count(value) > 0 as active
      from history_all
      where
        device = '${this.device.name}'
        and path = '${this.metric.activePath}'
        and time between '${start.toISOString()}' and '${stop.toISOString()}'
      limit 1;
    `
    console.log(sql)
    const result = await this.db.query(sql)
    const deviceWasActive = result.rows[0].active // t/f
    return deviceWasActive
  }

  // increment values in the bins table.
  // rounds the given time down to nearest min, hour, day, week etc,
  // and increments the given field for each.
  // field is eg 'active', 'available'.
  // const sql = `call increment_bins(${device_id}, '${time.toISOString()}', '${field}');`
  //     v_time := date_trunc(v_resolution, p_time); -- round down to start of current min, hour, day, etc
  //       'insert into bins (device_id, resolution, time, %s)
  //         values ($1, $2, $3, $4)
  //       on conflict (device_id, resolution, time) do
  //         update set %s = coalesce(bins.%s, 0) + $5;',
  //       v_field, v_field, v_field
  //     ) using p_device_id, ('1 '||v_resolution)::interval, v_time, p_delta, p_delta;
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
      console.log(sql)
      await this.db.query(sql)
    }
  }
}
