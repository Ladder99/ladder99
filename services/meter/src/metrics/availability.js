// read/write values for device availability calculations, where

// availability = time machine is active / time machine is available for use.
// active = part_count changed in previous time period.
// available = current time is within the schedule for the machine.

// availability is also called utilization in some client setups

// in client's setup.yaml, need something like this -
// metrics:
// - name: availability
//   activePath: controller/partOccurrence/part_count-all
//   startPath: processes/process_time-start
//   stopPath: processes/process_time-complete
//   jobPath: processes/job/process_aggregate_id-order_number

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

// however, different machines may have different setup times, which we
// don't want to count as 'available' time, so we check the 'jobPath' for the
// current job and track time spent in 'setup' mode, when we don't increment
// the 'available' bins.

// to calculate the 'availability' percentage, the metrics view in the db
// does 'active' / 'available'.

import { DateTime } from 'luxon' // for timezones - see https://moment.github.io/luxon/

const minutes = 60 * 1000 // 60 ms
const hours = 60 * minutes
const days = 24 * hours

const backfillDefaultStart = 30 * days // ie look this far back for first backfill date, by default
const metricIntervalDefault = 60 // seconds
const resolutions = 'minute,hour,day,week,month,year'.split(',') //. 5min? 15min?

//. move into db setup table
const deviceSetupTimes = {
  Jumbo: 0.5 * hours,
  Marumatsu: 0.5 * hours,
  Solarco: 0,
  PAC48: 0,
  Bahmuller: 0,
  Gazzella: 0,
}

export class Metric {
  constructor() {
    this.device = null
    this.metric = null
    this.db = null
    this.interval = null
    this.timer = null
    this.setupTimes = {}
  }

  async start({ client, db, device, metric }) {
    this.me = `Availability ${device.name} -`
    console.log(this.me, `initialize availability metric...`)
    console.log(this.me, `time resolutions`, resolutions)

    this.client = client
    this.db = db
    this.device = device // eg { id, name, custom, sources, ... }
    this.metric = metric // eg { driver, activePath, startPath, stopPath, jobPath, interval, ... }

    // get timezone offset from Zulu in milliseconds
    // this.timezoneOffset = client.timezoneOffsetHrs * hours // ms
    // use timezone string like 'America/Chicago' instead of a hardcoded offset like -5.
    // we can use Luxon to get offset for a particular timezone.
    // there's probably a better way to do this with luxon, but this is the simplest change.
    // const offsetMinutes = DateTime.now().setZone(this.client.timezone).offset // eg -420
    // now that encabulator is set to the user's timezone, we don't need an offset. 2022-11-12
    const offsetMinutes = 0
    this.timezoneOffset = offsetMinutes * 60 * 1000 // ms

    console.log(this.me, `get device node_id...`)
    this.device.node_id = await this.db.getDeviceId(device.name) // repeats until device is there
    console.log(this.me, `node_id`, this.device.node_id)

    //. poll for schedule info, save to this - set up timer for every 10mins?
    // pollSchedule vs pollMetrics?

    // get polling interval - either from metric in setup yaml or default value
    this.interval = (metric.interval || metricIntervalDefault) * 1000 // ms

    await this.backfill() // backfill missing values

    console.log(this.me, `poll with interval`, this.interval)
    await this.poll() // do first poll
    this.timer = setInterval(this.poll.bind(this), this.interval) // poll db
  }

  //

  async backfill() {
    const deviceName = this.device.name

    console.log(this.me, `backfilling missed dates...`)

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
    console.log(this.me, `lastRead`, lastRead)
    const startBackfill = lastRead ? new Date(lastRead) : defaultStart
    console.log(this.me, `startBackfill`, startBackfill)

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
    console.log(this.me, `backfill dict`, startStopTimes)

    const minToDate = min => new Date(min * minutes).toISOString()

    // loop from start to now, interval 1 min
    // check for active and available
    // write to bins table those values
    const startMinute = Math.floor(startBackfill.getTime() / minutes)
    const nowMinute = Math.floor(now.getTime() / minutes)
    console.log(
      this.me,
      `backfill start...now`,
      minToDate(startMinute),
      minToDate(nowMinute)
    )
    let state = null
    for (let minute = startMinute; minute < nowMinute; minute++) {
      console.log(this.me, `backfill minute`, minToDate(minute))
      const path = startStopTimes[minute]
      if (path === this.metric.startPath) {
        state = 1
      } else if (path === this.metric.stopPath) {
        state = 0
      }
      // if (state) {
      //   const time = new Date(minute * minutes)
      //   await this.updateBins(time, this.interval)
      // }
      // 2022-08-03 handle overtime by allowing active minutes outside of shift hours
      // check for events in previous n secs, eg 60
      const time = new Date(minute * minutes)
      const start = new Date(time.getTime() - 1 * minutes)
      const stop = time
      const deviceWasActive = await this.getActive(start, stop)
      if (deviceWasActive) {
        await this.incrementBins(time, 'active')
      }
      if (state) {
        await this.incrementBins(time, 'available')
      }
    }
    console.log(this.me, `backfill done`)
  }

  //

  // poll db and update bins - called by timer
  async poll() {
    const now = new Date()

    console.log(this.me, `poll db and update bins`, now)

    // get schedule for device, eg { start: Date<2022-01-13T05:00:00>, stop: ..., holiday }
    //. could do this every 10mins or so on separate timer, save to this.schedule
    const schedule = await this.getSchedule()

    // update active and available bins as needed
    const isDuringShift =
      !schedule.holiday && now >= schedule.start && now <= schedule.stop
    // 2022-08-03 handle overtime by allowing active minutes outside of shift hours
    const start =
      this.previousStopTime || new Date(now.getTime() - this.interval)
    const stop = now
    const deviceWasActive = await this.getActive(start, stop)
    if (deviceWasActive) {
      console.log(this.me, `increasing active bin`)
      await this.incrementBins(now, 'active')
    }
    if (isDuringShift) {
      const job = (await this.getJob()) ?? 'NONE' // eg '123456'
      // get setup time remaining for this job - subtracts poll interval (msec)
      let setupTime =
        this.setupTimes[job] ??
        (deviceSetupTimes[this.device.name] ?? 0) - this.interval
      if (setupTime < 0) setupTime = 0
      console.log(this.me, `setupTime remaining for job`, job, setupTime)
      // only increment the 'available' bins if we're NOT in setup time
      if (job === 'NONE' || setupTime <= 0) {
        console.log(this.me, `increasing available bin`)
        await this.incrementBins(now, 'available')
      }
      // save setup time remaining for this job
      this.setupTimes[job] = setupTime
    }
    this.previousStopTime = stop
  }

  // async updateBins(now, interval) {
  //   const deviceName = this.device.name
  //   // check for events in previous n secs, eg 60
  //   const start = new Date(now.getTime() - interval)
  //   const stop = now
  //   const deviceWasActive = await this.getActive(start, stop)
  //   // if device was active, increment the 'active' bin
  //   if (deviceWasActive) {
  //     console.log(`Availability ${deviceName} was active, increase active bin`)
  //     await this.incrementBins(now, 'active')
  //   }
  //   // always increment the 'available' bin
  //   await this.incrementBins(now, 'available')
  // }

  // query db for start and stop datetime dataitems.
  // converts the timestrings to local time for the client.
  //. will want to pass an optional datetime for the date to search for.
  async getSchedule() {
    const getHoliday = text =>
      text === 'UNAVAILABLE' || text === 'HOLIDAY' ? 'HOLIDAY' : undefined
    // fn to shift date by client timezoneOffset, as need for comparisons.
    const getDate = text =>
      new Date(new Date(text).getTime() - this.timezoneOffset)
    const table = 'history_text'
    const device = this.device
    const { startPath, stopPath } = this.metric
    // note: these can return 'UNAVAILABLE' or 'HOLIDAY', in which case,
    // schedule.start etc will be 'Invalid Date'.
    // any comparison with those will yield false.
    //. search for a given date, not latest value [why?]
    const startText = await this.db.getLatestValue(table, device, startPath)
    const stopText = await this.db.getLatestValue(table, device, stopPath)
    const holiday = getHoliday(startText) || getHoliday(stopText) // 'HOLIDAY' or undefined
    const start = holiday || getDate(startText) // 'HOLIDAY' or a Date object
    const stop = holiday || getDate(stopText)
    const schedule = { start, stop, holiday }
    // console.log(
    //   this.me, `${this.device.name} start, stop, holiday`,
    //   schedule.start,
    //   schedule.stop,
    //   schedule.holiday
    // )
    return schedule
  }

  // check if device was 'active' (ie has events on the active path), between two times.
  // returns true/false.
  async getActive(start, stop) {
    const sql = `
      select count(value) > 0 as active
      from history_float
      where
        device = '${this.device.name}'
        and path = '${this.metric.activePath}'
        and time between '${start.toISOString()}' and '${stop.toISOString()}'
      limit 1;
    `
    const result = await this.db.query(sql)
    const deviceWasActive = result.rows[0].active // t/f - column name must match case
    return deviceWasActive
  }

  async getJob() {
    const job = await this.db.getLatestValue(
      'history_text',
      this.device.name,
      this.metric.jobPath
    )
    return job
  }

  // increment values in the bins table.
  // rounds the given time down to nearest min, hour, day, week etc,
  // and increments the given field for each.
  // field is eg 'active', 'available'.
  //. what timezone is time in? what about timeISO?
  async incrementBins(time, field, delta = 1) {
    const timeISO = time.toISOString()
    // rollup counts for different time-scales.
    // this is an alternative to aggregated queries, which might use in future.
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
      await this.db.query(sql)
    }
  }
}
