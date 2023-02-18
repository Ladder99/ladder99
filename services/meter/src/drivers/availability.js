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

import { DateTime } from 'luxon' // for timezones - see https://moment.github.io/luxon/
import * as bins from '../bins.js'
import * as helpers from './helpers.js'

const minutes = 60 * 1000 // 60 ms
const hours = 60 * minutes
const days = 24 * hours

// const backfillDefaultStart = 60 * days // ie look this far back for first backfill date, by default
const backfillDefaultStart = 2 * days // ie look this far back for first backfill date, by default
const metricIntervalDefault = 60 // seconds
// const resolutions = 'minute,hour,day,week,month,year'.split(',') //. 5min? 15min?

export class Metric {
  //
  async start({ client, db, device, meter }) {
    this.me = `Availability ${device.path}:`
    console.log(this.me, `initialize`, meter)
    this.client = client
    this.db = db
    this.device = device // { path, ... }
    this.meter = meter

    this.activeFullPath = `${device.path}/${meter.activePath}`
    this.startFullPath = `${device.path}/${meter.startPath}`
    this.stopFullPath = `${device.path}/${meter.stopPath}`

    // can optionally get schedule from setup.devices table
    this.useSetupDevicesTableTimes = meter.useSetupDevicesTableTimes // eg true

    // can optionally specify a schedule for the machine in setup.yaml
    this.startTime = meter.startTime // eg '08:00'
    this.stopTime = meter.stopTime // eg '17:00'

    // get timezone offset from Zulu in milliseconds
    // this.timezoneOffset = client.timezoneOffsetHrs * hours // ms
    // use timezone string like 'America/Chicago' instead of a hardcoded offset like -5.
    // we can use Luxon to get offset for a particular timezone.
    // there's probably a better way to do this with luxon, but this is the simplest change.
    const offsetMinutes = DateTime.now().setZone(this.client.timezone).offset // eg -420
    this.timezoneOffset = offsetMinutes * 60 * 1000 // ms
    console.log(this.me, `tz, offset`, client.timezone, offsetMinutes)

    console.log(this.me, `getting device node_id for ${device.path}...`)
    this.device.node_id = await this.db.getNodeId(device.path) // repeats until device is there
    console.log(this.me, `node_id`, this.device.node_id)

    //. poll for schedule info, save to this - set up timer for every 10mins?
    // pollSchedule vs pollMetrics?

    // get polling interval - either from metric in setup yaml or default value
    this.interval = (meter.interval || metricIntervalDefault) * 1000 // ms

    // // get overtime active interval
    // this.overtimeActiveInterval = 5 * minutes // ms //. pass through the metric as above

    //. await this.backfill() // backfill missing values
    await this.poll() // do first poll
    this.timer = setInterval(this.poll.bind(this), this.interval) // poll db
  }

  // async backfill() {
  //   console.log(this.me, `backfilling missed dates...`)

  //   const now = new Date()
  //   const defaultStart = new Date(now.getTime() - backfillDefaultStart) // eg 30d ago

  //   // get starting point by finding most recent record in bins
  //   const sql = `
  //     select time
  //     from raw.bins
  //     where device_id=${this.device.node_id}
  //     order by time desc
  //     limit 1;
  //   `
  //   const result = await this.db.query(sql)
  //   const lastRead = result.rows.length > 0 && result.rows[0].time
  //   console.log(this.me, `lastRead`, lastRead) // will be false if NO data in bins
  //   if (lastRead) {
  //     const startBackfill = lastRead ? new Date(lastRead) : defaultStart
  //     console.log(this.me, `startBackfill`, startBackfill)

  //     // get alternating list of start/stop times since then, in order
  //     const sql2 = `
  //     select time, path, value
  //     from history_all
  //     where
  //       device = '${this.device.path}'
  //       and path in ('${this.startFullPath}', '${this.stopFullPath}')
  //       and time >= '${startBackfill.toISOString()}'
  //     order by time asc;
  //   `
  //     const result2 = await this.db.query(sql2)

  //     // loop over start/stop times, add to a dict.
  //     const startStopTimes = {} // map from minute to path
  //     for (let row of result2.rows) {
  //       // row.value is sthing like '2022-01-27T05:00:00' with NO Z -
  //       // ie it's 'local' time, which can only be interpreted correctly by
  //       // knowing the client's timezone. so need to subtract that offset
  //       const localTime = row.value
  //       const time = new Date(localTime).getTime() - this.timezoneOffset
  //       if (!isNaN(time)) {
  //         const minute = Math.floor(time / minutes)
  //         startStopTimes[minute] = row.path
  //       }
  //     }
  //     console.log(this.me, `startStopTimes`, startStopTimes)

  //     // loop from start to now, interval 1 min
  //     // check for active and available
  //     // write to bins table those values
  //     const startMinute = Math.floor(startBackfill.getTime() / minutes)
  //     const nowMinute = Math.floor(now.getTime() / minutes)
  //     console.log(this.me, `loop start to now minutes`, startMinute, nowMinute)
  //     let state = null
  //     for (let minute = startMinute; minute < nowMinute; minute++) {
  //       // console.log(`Availability - backfill minute`, minute)
  //       const path = startStopTimes[minute]
  //       if (path === this.startFullPath) {
  //         state = 2
  //       } else if (path === this.stopFullPath) {
  //         state = 1
  //       } else {
  //         state = null
  //       }
  //       if (state) {
  //         // 2022-08-03 handle overtime by allowing active minutes outside of shift hours
  //         // check for events in previous n secs, eg 60
  //         const time = new Date(minute * minutes)
  //         const start = new Date(time.getTime() - 1 * minutes)
  //         const stop = time
  //         const deviceWasActive = await this.getActive(start, stop)
  //         if (deviceWasActive) {
  //           await this.incrementBins(time, 'active')
  //         }
  //         if (state === 2) {
  //           await this.incrementBins(time, 'available')
  //         }
  //       }
  //     }
  //   }
  //   console.log(this.me, `backfill done`)
  // }

  //

  // poll db and update bins - called by timer
  async poll() {
    console.log(this.me, `poll db and update bins`)

    const now = new Date() // eg 2022-01-13T12:00:00.000Z - js dates are in UTC

    // get schedule for device, eg { start: 2022-01-13T11:00:00Z, stop: ..., holiday: undefined }
    const schedule = await this.getSchedule()
    // const isDuringShift =
    //   !schedule.holiday && now >= schedule.start && now <= schedule.stop
    const isDuringShift = getIsDuringShift(now, schedule)

    // update active and available bins as needed
    // 2022-08-03 handle overtime by allowing active minutes outside of shift hours -
    // this means availability can theoretically be > 100%.
    const start =
      this.previousStopTime || new Date(now.getTime() - this.interval)
    const stop = now
    const deviceWasActive = await this.getActive(start, stop)
    if (deviceWasActive) {
      console.log(this.me, `increasing active bin`)
      await bins.add(this.db, this.device.node_id, now, 'active')
    }
    if (isDuringShift) {
      console.log(this.me, now, `- increasing available bin`)
      await bins.add(this.db, this.device.node_id, now, 'available')
    }
    this.previousStopTime = stop
  }

  // get schedule from setup.schedule table, setup.devices table,
  // setup.yaml, or history_text dataitems.
  // returns { start, stop, holiday, downtimes }, where
  //   start is a Date object or 'HOLIDAY',
  //   stop is same,
  //   holiday is 'HOLIDAY' or undefined,
  //   downtimes is an array of { start, stop } objects, or undefined.
  //   eg { start: 2022-01-13T11:00:00Z, stop: ..., holiday, downtimes }
  //. instrument this fn and subfns for testing.
  async getSchedule() {
    let schedule = {} // { start, stop, holiday, downtimes }

    // handle start/stop/downtimes as set in setup.schedule table
    if (this.useSetupScheduleTableTimes) {
      const today = this.getToday() // eg '2023-02-16'
      const result = await this.db.query(
        `SELECT start, stop, downtimes FROM setup.schedule WHERE path = $1 AND date = $2`,
        [this.device.path, today]
      )
      console.log('rows', result.rows)
      if (result.rows.length === 0) {
        schedule = {
          start: null,
          stop: null,
          holiday: undefined,
          downtimes: null,
        }
      } else {
        const row = result.rows[0]
        const start = this.getDate(today + 'T' + row.start) // row.start and stop will be 24h format from db
        const stop = this.getDate(today + 'T' + row.stop)
        const holiday = undefined
        const downtimes = this.getDowntimes(today, row.downtimes) // parse '10:00am,10\n2:00pm,10' into array of objects
        schedule = { start, stop, holiday, downtimes }
      }
    } else if (this.useSetupDevicesTableTimes) {
      // handle start/stop times as set in setup.devices table
      const result = await this.db.query(
        `SELECT shift_start, shift_stop FROM setup.devices WHERE path = $1`,
        [this.device.path]
      )
      if (result.rows.length === 0) {
        // add a new record to setup.devices, and use setup.yaml values for start/stop times.
        console.log(this.me, 'insert new record for device', this.device.path)
        await this.db.query(
          `INSERT INTO setup.devices (path, shift_start, shift_stop) VALUES ($1, $2, $3)`,
          [this.device.path, this.startTime, this.stopTime]
        )
        // use setup.yaml values
        // keep in synch with code below
        console.log(this.me, 'get shift times from setup.yaml')
        const today = this.getToday() // eg '2022-01-16'
        // times are like '05:00', so need to tack it onto current date + 'T'.
        const start = this.getDate(today + 'T' + this.startTime)
        const stop = this.getDate(today + 'T' + this.stopTime)
        const holiday = undefined // for now
        schedule = { start, stop, holiday }
      } else {
        // use setup.devices table values
        console.log(this.me, 'get shift times from setup.devices table')
        const today = this.getToday() // eg '2022-01-16'
        const { shift_start, shift_stop } = result.rows[0]
        // times are like '05:00', so need to tack it onto current date + 'T'.
        const start = this.getDate(today + 'T' + shift_start)
        const stop = this.getDate(today + 'T' + shift_stop)
        const holiday = undefined // for now
        schedule = { start, stop, holiday }
      }
    } else if (this.startTime) {
      // use setup.yaml values
      // keep in synch with code above
      console.log(this.me, 'get shift times from setup.yaml')
      const today = this.getToday() // eg '2022-01-16'
      // times are like '05:00', so need to tack it onto current date + 'T'.
      const start = this.getDate(today + 'T' + this.startTime)
      const stop = this.getDate(today + 'T' + this.stopTime)
      const holiday = undefined // for now
      schedule = { start, stop, holiday }
    } else {
      // use history_text values, eg via jobboss driver.
      console.log(this.me, 'get shift times from start/stop paths')
      const table = 'history_text'
      const device = this.device
      // get start/stop datetimes, with no Z.
      // device includes { path }
      // note: these can return 'UNAVAILABLE' or 'HOLIDAY', in which case,
      // schedule.start etc will be 'Invalid Date'.
      // any comparison with those will yield false.
      // these can also return false if no value found.
      const startText = await this.db.getLatestValue(
        table,
        device,
        this.startFullPath
      )
      const stopText = await this.db.getLatestValue(
        table,
        device,
        this.stopFullPath
      )
      const holiday = getHoliday(startText) || getHoliday(stopText) // 'HOLIDAY' or undefined
      const start = holiday || this.getDate(startText) // 'HOLIDAY' or a Date object
      const stop = holiday || this.getDate(stopText)
      schedule = { start, stop, holiday }
    }
    console.log(this.me, schedule.start, 'to', schedule.stop)
    return schedule
  }

  // check if device was 'active' (ie has events on the active path), between two times.
  // returns true/false.
  async getActive(start, stop) {
    const sql = `
      select count(value) > 0 as active
      from history_float
      where
        device = '${this.device.path}'
        and path = '${this.activeFullPath}'
        and time between '${start.toISOString()}' and '${stop.toISOString()}'
      limit 1;
    `
    const result = await this.db.query(sql)
    const deviceWasActive = result?.rows[0]?.active // t/f - column name must match case
    return deviceWasActive
  }

  // helper methods

  // get date from text, eg '2022-01-13T05:00:00' -> 2022-01-13T11:00:00.000Z.
  // shifts date by client timezoneOffset, as will be needed for comparisons.
  getDate(text) {
    return new Date(new Date(text).getTime() - this.timezoneOffset)
  }

  // get today's date in local (not Z) timezone, eg '2022-01-16'.
  getToday() {
    return new Date(new Date().getTime() + this.timezoneOffset)
      .toISOString()
      .slice(0, 10)
  }

  // get downtimes from text like '10:00am,10\n2:00pm,10'
  // into array like [{ start, stop }, ...],
  // where start and stop are Date objects.
  getDowntimes(today, text) {
    if (!text) return []
    const lines = text.split('\n')
    const downtimes = lines.map(line => {
      let [startTime, mins] = line.split(',') // eg ['3:00pm', '10']
      startTime = helpers.sanitizeTime(startTime) // eg '15:00'
      const start = this.getDate(today + 'T' + startTime) // eg 2023-02-17T10:00:00Z
      const stop = new Date(start.getTime() + Number(mins) * 60 * 1000) // eg 2023-02-17T10:10:00Z
      return { start, stop }
    })
    return downtimes
  }
}

// helper fns

// is the current time during a shift, and not during a downtime or holiday?
function getIsDuringShift(now, schedule) {
  if (schedule.holiday) {
    return false
  }
  for (let downtime of schedule.downtimes) {
    const [start, stop] = downtime
    if (now >= start && now <= stop) return false
  }
  const isDuringShift = now >= schedule.start && now <= schedule.stop
  return isDuringShift
}

// get holiday status from a value
function getHoliday(value) {
  const holiday =
    value === 'UNAVAILABLE' || value === 'HOLIDAY' || value === false
      ? 'HOLIDAY'
      : undefined
  return holiday
}
