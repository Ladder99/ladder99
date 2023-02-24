// manage schedule (shift start, stop, downtimes) for a device

// in setup.yaml need something like this -
// meters:
//   schedule:
//     source: scheduleTable # use setup.schedule table (keyed on device path, date, with start, stop, downtimes)
//     # source: devicesTable # use setup.devices table (keyed on device path, with start, stop) - use startTime and stopTime as defaults for new devices
//     # source: dataItems
//     # source: fixedTimes
//     # startTime: '08:00' # string in 24h format
//     # stopTime: '17:00' # string in 24h format
//     # startPath: Processes/ProcessTimeStart
//     # stopPath: Processes/ProcessTimeComplete

import * as helpers from './drivers/helpers.js'

const intervalDefault = 60 // seconds

export class Schedule {
  //
  async start({ db, meters, client, device }) {
    this.me = `Schedule ${device.path}:`
    console.log(this.me, `start`)

    this.db = db
    this.meters = meters // { schedule, ... }
    this.client = client // { timezone, ...}
    this.device = device // { path, ... }

    this.timezone = client.timezone // eg 'America/Chicago'
    this.source = meters.schedule.source // scheduleTable, devicesTable, dataItems, fixedTimes
    this.startTime = meters.schedule.startTime // eg '08:00'
    this.stopTime = meters.schedule.stopTime // eg '17:00'

    // path to schedule dataitems
    this.startFullPath = `${device.path}/${meters.schedule.startPath}` // eg 'Main/ConversionPress/Controller/Path/ProcessTimeStart'
    this.stopFullPath = `${device.path}/${meters.schedule.stopPath}`

    // schedule data
    this.start = null // Date object or 'HOLIDAY'
    this.stop = null // Date object or 'HOLIDAY'
    this.holiday = null // 'HOLIDAY' or null
    this.downtimes = null // array of { start, stop } objects, or null

    // do first poll and start timer
    this.poll()
    this.timer = setInterval(this.poll.bind(this), intervalDefault * 1000) // poll db
  }

  // get schedule from setup.schedule table, setup.devices table,
  // setup.yaml, or history table dataitems.
  // sets this.{ start, stop, holiday, downtimes }, where
  //   start is a Date object or 'HOLIDAY',
  //   stop is same,
  //   holiday is 'HOLIDAY' or null,
  //   downtimes is an array of { start, stop } objects, or null.
  // eg { start: 2022-01-13T11:00:00Z, stop: ..., holiday, downtimes }
  async poll() {
    //
    const today = helpers.getTodayLocal(this.timezone) // eg '2023-02-16'
    console.log(this.me, 'poll - today', today)
    console.log(this.me, 'source', this.source) // eg 'scheduleTable'

    // use setup.schedule table
    if (this.source === 'scheduleTable') {
      const result = await this.db.query(
        `SELECT start, stop, downtimes FROM setup.schedule WHERE path = $1 AND date = $2`,
        [this.device.path, today]
      )
      // console.log(this.me, 'got setup.schedule rows', result.rows)
      if (result.rows.length === 0) {
        this.start = null
        this.stop = null
        this.holiday = null
        this.downtimes = null
      } else {
        const row = result.rows[0]
        // row.start and stop will be in 24h format from db, eg '15:00', in local time (no Z),
        // because they are postgres time columns.
        this.start = helpers.getDate(today, row.start, this.timezone)
        this.stop = helpers.getDate(today, row.stop, this.timezone)
        this.holiday = null
        this.downtimes = helpers.getDowntimes(
          today,
          row.downtimes,
          this.timezone
        ) // parse '10:00am,10\n2pm,10' into array of objects
      }
    } else if (this.source === 'devicesTable') {
      // use setup.devices table
      // shift_start and shift_stop are text columns, so might not be in 24h format.
      // but we use helpers.getDate below, which sanitizes times.
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
        console.log(
          this.me,
          'get shift times from setup.yaml',
          this.startTime,
          this.stopTime
        )
        // times should be like '05:00', so need to tack it onto current date + 'T'.
        this.start = helpers.getDate(today, this.startTime, this.timezone)
        this.stop = helpers.getDate(today, this.stopTime, this.timezone)
        this.holiday = null // for now
      } else {
        // use setup.devices table values
        console.log(this.me, 'get shift times from setup.devices table')
        // times should be like '15:00', so need to tack it onto current date + 'T'.
        const shift_start = result.rows[0]?.shift_start
        const shift_stop = result.rows[0]?.shift_stop
        this.start = helpers.getDate(today, shift_start, this.timezone)
        this.stop = helpers.getDate(today, shift_stop, this.timezone)
        this.holiday = null // for now
      }
    } else if (this.source === 'fixedTimes') {
      // use setup.yaml values
      // keep in synch with code above
      console.log(
        this.me,
        'get shift times from setup.yaml',
        this.startTime,
        this.stopTime
      )
      // times should be like '05:00', so need to tack it onto current date + 'T'.
      this.start = helpers.getDate(today, this.startTime, this.timezone)
      this.stop = helpers.getDate(today, this.stopTime, this.timezone)
      this.holiday = null // for now
    } else if (this.source === 'dataItems') {
      // use history_text values, eg via jobboss driver
      console.log(this.me, 'get shift times from start/stop paths')
      // get start/stop datetimes, with no Z, eg '2022-01-16T15:00:00'
      // note: these can return 'UNAVAILABLE' or 'HOLIDAY', in which case,
      // this.start etc will be 'Invalid Date' - any comparison with those will yield false.
      // these fns will return false if no value found.
      const table = 'history_text'
      const startText = await this.db.getLatestValue(
        table,
        this.device,
        this.startFullPath
      ) // eg '2022-01-16T15:00:00' or false
      const stopText = await this.db.getLatestValue(
        table,
        this.device,
        this.stopFullPath
      )
      this.holiday = getHoliday(startText) || getHoliday(stopText) // 'HOLIDAY' or null
      // note getDate allows null for time
      this.start =
        this.holiday || helpers.getDate(startText, null, this.timezone) // 'HOLIDAY' or a Date object
      this.stop = this.holiday || helpers.getDate(stopText, null, this.timezone)
    } else {
      console.log(this.me, 'unknown source', this.source)
      return
    }
    console.log(this.me, 'got', this.start, this.stop, this.downtimes)
  }

  // is the current time during a shift, and not during a downtime or holiday?
  // now is a Date object, schedule is { start, stop, holiday, downtimes },
  // where downtimes is an array of { start, stop } Date objects.
  isDuringShift() {
    const now = new Date() // eg 2022-01-13T12:00:00.000Z - js dates are stored in Z/UTC
    if (this.holiday) {
      // console.log(this.me, 'on holiday')
      return false
    }
    // console.log(this.me, 'check downtimes', this.downtimes)
    for (let downtime of this.downtimes || []) {
      const { start, stop } = downtime
      // console.log(this.me, 'checking downtime', start, stop)
      if (now >= start && now <= stop) {
        // console.log(this.me, 'in downtime')
        return false
      }
    }
    if (now >= this.start && now <= this.stop) {
      // console.log(this.me, 'in shift')
      return true
    }
    // console.log(this.me, 'not in shift')
    return false
  }
}

// get holiday status ('HOLIDAY' or null) from a value
function getHoliday(value) {
  const holiday =
    value === 'UNAVAILABLE' || value === 'HOLIDAY' || value === false
      ? 'HOLIDAY'
      : null
  return holiday
}
