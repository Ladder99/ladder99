// read/write values for device availability calculations, where

// availability = time machine is active / time machine is available for use.
// active = part_count changed in previous time period.
// available = current time is within the schedule for the machine.

// availability is also called utilization in some client setups

// in client's setup.yaml, need something like this -
// meters:
//   # availability
//   # gets active = time machine was active in previous time period,
//   # based on part count changes, and available = time is within start/stop schedule.
//   availability:
//     driver: availability
//     activePath: Controller/Path/PartCountAll
//     useSetupScheduleTableTimes: true # use setup.schedule table to get start/stop times
//     # useSetupDevicesTableTimes: true # use setup.devices table to get start/stop times
//     # startTime: '08:00'
//     # stopTime: '17:00'
//     # startPath: Processes/ProcessTimeStart
//     # stopPath: Processes/ProcessTimeComplete

// driver = availability will cause this js plugin to be loaded.
// then this code uses the given paths to look in the database for
// activity and schedule information.
// it then writes out the availability metric for each minute, hour, day, etc.

// each minute will have a value 0 or 1, because we have to choose some
// unit of time to look at the activity of a machine to say if it was 'active'
// or not, and a minute seems like a good unit for these big machines.
//. (or could pass base time unit in setup yaml)
// and if it's active, it will also increment the current hour, day, month, year bins.
// this lets us look at the timeline at different resolutions in the dashboard.

// if the current time is within the machine's schedule, it will similarly
// increment the minute, hour, day, etc bins for 'available'.

// to calculate the 'availability' percentage, the metrics view in the db
// does 'active' / 'available'.

import * as bins from '../bins.js'
import * as helpers from './helpers.js'

// const minutes = 60 * 1000 // 60 ms
// const hours = 60 * minutes
// const days = 24 * hours
// const backfillDefaultStart = 60 * days // ie look this far back for first backfill date, by default
// const backfillDefaultStart = 2 * days // ie look this far back for first backfill date, by default

const metricIntervalDefault = 60 // seconds

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

    // can optionally specify a schedule for the machine in setup.yaml
    this.startTime = meter.startTime // eg '08:00'
    this.stopTime = meter.stopTime // eg '17:00'

    console.log(this.me, `getting device node_id for ${device.path}...`)
    this.device.node_id = await this.db.getNodeId(device.path) // repeats until device is there
    console.log(this.me, `node_id`, this.device.node_id)

    //. poll for schedule info, save to this - set up timer for every 10mins?
    // pollSchedule vs pollMetrics?

    // get polling interval - either from metric in setup yaml or default value
    this.intervalMs = (meter.interval || metricIntervalDefault) * 1000 // ms

    await this.poll() // do first poll
    this.timer = setInterval(this.poll.bind(this), this.intervalMs) // poll db
  }

  //

  // poll db and update bins
  async poll() {
    console.log(this.me, `poll db and update bins`)

    const now = new Date() // eg 2022-01-13T12:00:00.000Z - js dates are stored in Z/UTC

    // increment active bins if device was active in previous time interval.
    // handle overtime by allowing active minutes outside of shift hours -
    // this means availability can theoretically be > 100%.
    const start =
      this.previousStopTime || new Date(now.getTime() - this.intervalMs)
    const stop = now
    const deviceWasActive = await this.getActive(start, stop)
    if (deviceWasActive) {
      console.log(this.me, `increasing active bin`)
      await bins.add(this.db, this.device.node_id, now, 'active')
    }

    // get schedule for device, eg { start: 2022-01-13T11:00:00Z, stop: ..., holiday, downtimes }
    const schedule = await this.getSchedule()

    // increment available bins if we're within the schedule for the device and not in a downtime.
    const isDuringShift = getIsDuringShift(now, schedule)
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
  //   holiday is 'HOLIDAY' or null,
  //   downtimes is an array of { start, stop } objects, or null.
  // eg { start: 2022-01-13T11:00:00Z, stop: ..., holiday, downtimes }
  async getSchedule() {
    let schedule = {} // { start, stop, holiday, downtimes }

    // handle start/stop/downtimes as set in setup.schedule table
    if (this.meter.useSetupScheduleTableTimes) {
      const today = helpers.getToday() // eg '2023-02-16'
      const result = await this.db.query(
        `SELECT start, stop, downtimes FROM setup.schedule WHERE path = $1 AND date = $2`,
        [this.device.path, today]
      )
      console.log('rows', result.rows)
      if (result.rows.length === 0) {
        schedule = {
          start: null,
          stop: null,
          holiday: null,
          downtimes: null,
        }
      } else {
        const row = result.rows[0]
        // row.start and stop will be in 24h format from db, eg '15:00', in local time (no Z).
        const start = new Date(today + 'T' + row.start)
        const stop = new Date(today + 'T' + row.stop)
        const holiday = null
        const downtimes = helpers.getDowntimes(today, row.downtimes) // parse '10:00am,10\n2:00pm,10' into array of objects
        schedule = { start, stop, holiday, downtimes }
      }
    } else if (this.meter.useSetupDevicesTableTimes) {
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
        const today = helpers.getToday() // eg '2022-01-16'
        // times are like '05:00', so need to tack it onto current date + 'T'.
        const start = new Date(today + 'T' + this.startTime)
        const stop = new Date(today + 'T' + this.stopTime)
        const holiday = null // for now
        schedule = { start, stop, holiday }
      } else {
        // use setup.devices table values
        console.log(this.me, 'get shift times from setup.devices table')
        const today = helpers.getToday() // eg '2022-01-16'
        // times are like '15:00', so need to tack it onto current date + 'T'.
        const { shift_start, shift_stop } = result.rows[0]
        const start = new Date(today + 'T' + shift_start)
        const stop = new Date(today + 'T' + shift_stop)
        const holiday = null // for now
        schedule = { start, stop, holiday }
      }
    } else if (this.startTime) {
      // use setup.yaml values
      // keep in synch with code above
      console.log(this.me, 'get shift times from setup.yaml')
      const today = helpers.getToday() // eg '2022-01-16'
      // times are like '05:00', so need to tack it onto current date + 'T'.
      const start = new Date(today + 'T' + this.startTime)
      const stop = new Date(today + 'T' + this.stopTime)
      const holiday = null // for now
      schedule = { start, stop, holiday }
    } else {
      // use history_text values, eg via jobboss driver.
      console.log(this.me, 'get shift times from start/stop paths')
      const table = 'history_text'
      const device = this.device
      // get start/stop datetimes, with no Z, eg '2022-01-16T15:00:00'
      // device includes { path }
      // note: these can return 'UNAVAILABLE' or 'HOLIDAY', in which case,
      // schedule.start etc will be 'Invalid Date' - any comparison with those will yield false.
      // these fns will return false if no value found.
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
      const holiday = getHoliday(startText) || getHoliday(stopText) // 'HOLIDAY' or null
      const start = holiday || new Date(startText) // 'HOLIDAY' or a Date object
      const stop = holiday || new Date(stopText)
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
}

// helper fns

// get holiday status ('HOLIDAY' or null) from a value
function getHoliday(value) {
  const holiday =
    value === 'UNAVAILABLE' || value === 'HOLIDAY' || value === false
      ? 'HOLIDAY'
      : null
  return holiday
}
