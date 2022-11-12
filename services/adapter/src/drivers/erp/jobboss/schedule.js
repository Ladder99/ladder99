// check schedule info from jobboss db

import fs from 'fs' // node lib for filesys
import { DateTime } from 'luxon' // see https://moment.github.io/luxon/

const minutes = 60 * 1000 // 60 ms
const hours = 60 * minutes
const days = 24 * hours

const pollInterval = 10 * minutes // ie poll for schedule change every n minutes
const backfillDefaultStart = 30 * days // ie look this far back for first backfill date, by default
const cookiePath = '/data/adapter/cookies/jobboss/schedule.json'

export class Schedule {
  //
  // check jobboss for schedule for each device in devices
  async start({ cache, pool, devices, client }) {
    console.log('Jobboss schedule - backfill/start poll', pollInterval, 'ms')
    this.cache = cache
    this.pool = pool
    this.devices = devices
    this.client = client

    await this.backfill() // backfill from last written value to today
    await this.poll() // do initial poll
    setInterval(this.poll.bind(this), pollInterval) // start poll timer
  }

  async backfill() {
    console.log(`JobBoss schedule backfill any missed dates...`)

    const now = new Date()
    const defaultStart = new Date(now.getTime() - backfillDefaultStart) // eg 60d ago

    // read cookie file, if any
    let cookie = {}
    try {
      console.log(`JobBoss schedule backfill - read cookie file...`)
      const s = String(fs.readFileSync(cookiePath))
      cookie = JSON.parse(s)
      console.log(`JobBoss schedule backfill - cookie`, cookie)
    } catch (e) {
      console.log(
        `JobBoss schedule backfill error - no cookie file, use`,
        defaultStart
      )
    }

    // loop over devices from setup.yaml
    for (let device of this.devices) {
      //
      // just want those with a jobbossId (ie workcenter object uuid)
      const jobbossId = device.custom?.jobbossId
      if (jobbossId) {
        //
        // get last date from cookie file
        const { lastRead } = cookie[device.name] || {} // eg '2022-01-11T01:21:00'

        // get start date and ndays ago
        const start = lastRead ? new Date(lastRead) : defaultStart
        const ndays = Math.floor((now.getTime() - start.getTime()) / days)
        console.log(`JobBoss schedule backfill - start and ndays`, start, ndays)

        // lookup missing days and set values
        for (let day = 0; day < ndays; day++) {
          const datetime = new Date(start.getTime() + day * days)
          const schedule = await this.getSchedule(device, datetime) // get { start, stop }
          // console.log(`JobBoss - day, datetime, sched`, day, datetime, schedule)
          // timestamp string in 3rd param is optional for cache.set -
          // need it here so xml will get the value for relay to pick up,
          // so meter can filter to a record it needs.
          // note: schedule.start/stop can be null or HOLIDAY etc
          const timestamp = datetime.toISOString()
          this.cache.set(`${device.id}-start`, schedule.start, { timestamp })
          this.cache.set(`${device.id}-complete`, schedule.stop, { timestamp })
        }

        // update cookie
        cookie[device.name] = { lastRead: now.toISOString() }
      }

      // update cookie file
      console.log(`JobBoss schedule backfill - update cookie file`, cookiePath)
      try {
        fs.writeFileSync(cookiePath, JSON.stringify(cookie))
      } catch (e) {
        console.log('JobBoss schedule backfill - error writing cookie file')
      }
    }
    console.log(`JobBoss schedule backfill - done`)
  }

  // poll the jobboss schedule information for current day,
  // and write to the cache
  async poll() {
    // console.log(`Jobboss schedule - poll`)

    // since the server is set to Z/GMT time, need to 'trick' it to thinking it's 5 or 6 hrs earlier
    // const datetime = new Date(
    //   new Date().getTime() +
    //     (this.client.timezoneOffsetHrs || 0) * 60 * 60 * 1000
    // )
    // we can use Luxon to get offset for a particular timezone, eg 'America/Chicago'.
    // ie instead of hardcoding it to -5 hours or something.
    // there's probably a better way to do this with luxon, but this is the simplest change.
    // const offsetMinutes = DateTime.now().setZone(this.client.timezone).offset // eg -420
    // now that encabulator is in client's timezone, we don't need an offset. 2022-11-12
    const offsetMinutes = 0
    // console.log(`JobBoss schedule - offsetMinutes`, offsetMinutes)
    const datetime = new Date(new Date().getTime() + offsetMinutes * 60 * 1000) // ms
    // console.log(`JobBoss schedule - datetime`, datetime)

    for (let device of this.devices) {
      const jobbossId = device.custom?.jobbossId
      if (jobbossId) {
        const schedule = await this.getSchedule(device, datetime) // get { start, stop }
        console.log(
          'JobBoss schedule',
          device.name,
          schedule.start,
          schedule.stop
        )
        // write start/stop times to cache for this device -
        // start/stop are STRINGS like 'UNAVAILABLE', or 'HOLIDAY', or
        // '2022-01-23T05:00:00' with NO Z!
        // that way, they will be interpreted by new Date(start) as a local time.
        this.cache.set(`${device.id}-start`, schedule.start)
        this.cache.set(`${device.id}-complete`, schedule.stop)
      }
    }
  }

  // get workcenter schedule for given device and datetime.
  // return as { start, stop } times, which can be strings like
  // '2022-01-23 05:00:00' (with no Z! it's local time), or 'HOLIDAY',
  // or 'UNAVAILABLE'.
  async getSchedule(device, datetime) {
    // console.log(`JobBoss schedule - get for`, device.name, datetime)

    const jobbossId = device.custom?.jobbossId // eg '8EE4B90E-7224-4A71-BE5E-C6A713AECF59' for Marumatsu
    const sequence = datetime.getDay() // day of week with 0=sunday, 1=monday. this works even if Z time is next day.
    const dateString = getLocalDateFromDateTime(datetime) // eg '2022-01-18' - works even if Z time is next day.

    // default values
    let start = 'UNAVAILABLE'
    let stop = 'UNAVAILABLE'

    // lookup workcenter and date in wc shift override table
    let result1
    try {
      // select Shift_ID, Is_Work_Day from WCShift_Override where WorkCenter_OID=${jobbossId} and cast(Date as date)=${dateString}
      result1 = await this.pool.query`
        select Shift_ID, Is_Work_Day 
        from WCShift_Override
        where WorkCenter_OID=${jobbossId} and cast(Date as date)=${dateString}
      `
    } catch (error) {
      console.log('JobBoss schedule error', error.message)
      return { start, stop }
    }

    if (result1.recordset.length === 0) {
      //
      // console.log(`JobBoss schedule - no override, so get standard schedule`)
      // if no record then lookup jobbossId in WCShift_Standard
      //   get shift_id, look that up with sequencenum in shift_day table for start/end
      // (or do a join query)
      const result2 = await this.pool.query`
        select cast(Start_Time as time) start, cast(End_Time as time) stop
        from WCShift_Standard wss
          join Shift_Day sd on wss.Shift_ID=sd.Shift
        where WorkCenter_OID=${jobbossId} and Sequence=${sequence}
      `
      if (result2.recordset.length > 0) {
        // note: start stop are Date objects
        start = result2.recordset[0].start // eg 1970-01-01T05:00:00Z - note the Z
        stop = result2.recordset[0].stop // eg 1970-01-01T13:30:00Z
        // convert to strings
        start = getTimeAsLocalDateTimeString(start, datetime, dateString) // no Z!
        stop = getTimeAsLocalDateTimeString(stop, datetime, dateString)
        // console.log(`JobBoss schedule - start, stop`, start, stop)
      } else {
        // console.log(`JobBoss schedule - no results`)
      }
    } else if (result1.recordset[0].Is_Work_Day) {
      //
      // console.log(`JobBoss schedule - work day override - get schedule...`)
      // if isworkday then lookup hours in shift_day table -
      //   get shift_id, lookup in shift_day table with dayofweek for sequencenum
      //   get start/end times from record
      const result3 = await this.pool.query`
        select cast(Start_Time as time) start, cast(End_Time as time) stop
        from WCShift_Override wso
          join Shift_Day sd on wso.Shift_ID = sd.Shift
        where WorkCenter_OID=${jobbossId} 
          and Date=${dateString} and Sequence=${sequence}
      `
      if (result3.recordset.length > 0) {
        // note: start stop are Date objects
        start = result3.recordset[0].start // eg 1970-01-01T05:00:00Z - note the Z
        stop = result3.recordset[0].stop
        // convert to strings
        start = getTimeAsLocalDateTimeString(start, datetime, dateString) // no Z!
        stop = getTimeAsLocalDateTimeString(stop, datetime, dateString)
        // console.log(`JobBoss schedule - start, stop`, start, stop)
      } else {
        // console.log(`JobBoss schedule - no results`)
      }
    } else {
      //
      // if isworkday=0 then not a workday - might have 2 records, one for each shift
      //. for now just say the whole day is a holiday - no start/end times
      // console.log(`JobBoss schedule - day is holiday (isworkday=0)...`)
      start = 'HOLIDAY'
      stop = 'HOLIDAY'
    }
    return { start, stop }
  }
}

//. move these to common library

// get a date string from a datetime value,
// eg 2022-01-18T14:24:00 -> '2022-01-18'
// accounts for timezone offset, which is in minutes
function getLocalDateFromDateTime(dt) {
  const tz = dt.getTimezoneOffset() * 60 * 1000
  const date = new Date(dt.getTime() - tz).toISOString().split('T')[0]
  return date
}

// given a time like 1970-01-01T05:00:00Z from jobboss,
// and a datetime like 2022-01-23T12:13:09Z,
// return a string like '2022-01-23T05:00:00' with NO Z!
// ie assign the date of the datetime value to the time value.
function getTimeAsLocalDateTimeString(time, datetime, dateString) {
  const timeString = time.toISOString().split('T')[1].replace('Z', '') // eg '05:00:00'
  const local = new Date(dateString + 'T' + timeString) //. eg
  // now set the date portion to the given datetime's date
  //. didn't we already do this above?
  local.setFullYear(datetime.getFullYear())
  local.setMonth(datetime.getMonth())
  local.setDate(datetime.getDate())
  const s = local.toISOString().replace('Z', '') // ditch the Z so it's local time
  return s
}
