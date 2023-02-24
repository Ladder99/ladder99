// helper fns for drivers
// run 'node helpers-test.js' for tests
//. could move into common lib later

import { DateTime } from 'luxon'

// get date from day like '2023-02-18' and local time like '10:00am'
// eg would return a Date object 2023-02-18T16:00:00Z
// can pass time=null to get just the day at midnight local time
// this handles daylight savings
export function getDate(date, time, timezone) {
  const dateTime = time ? date + 'T' + time : date // eg '2023-02-17T15:00' // local time - no Z
  //. handle errors
  return DateTime.fromISO(dateTime, { zone: timezone }).toJSDate()
}

// get today's date as string, eg '2023-02-15'
// use timezone offset so we get the LOCAL day, not UTC day
// this should handle daylight savings
export function getTodayLocal() {
  return DateTime.local().toISODate()
}

// get downtimes from day like '2023-02-18' and text like '10:00am,10\n 2pm, 10 '
// into array like [{ start, stop }, ...], where start and stop are Date objects with Z timezone.
// returns null if there are any syntax errors.
export function getDowntimes(day, text, timezone) {
  if (!text) return []
  const lines = text.split('\n')
  const downtimes = lines.map(line => {
    let [startTime, mins] = line.split(',') // eg ['5am', '10']
    startTime = sanitizeTime(startTime) // eg '05:00'
    if (startTime === null) {
      return null
    }
    if (!Number(mins)) {
      return null
    }
    const startDateTime = day + 'T' + startTime // eg '2023-02-17T15:00' // local time - no Z
    console.log('startDateTime', startDateTime)
    const start = getDate(startDateTime, null, timezone)
    console.log('start', start)
    const stop = new Date(start.getTime() + Number(mins) * 60 * 1000) // eg 2023-02-17T21:10:00Z
    console.log('stop', stop)
    return { start, stop }
  })
  return downtimes.some(downtime => downtime === null) ? null : downtimes
}

// sanitize time - convert anything to 24h format
// eg '1pm' -> '13:00', '9' -> '09:00', '15:00:00' -> '15:00'
export function sanitizeTime(value) {
  const m = value.match(
    /^[ ]*([0-9]?[0-9])(:([0-9][0-9]))?(:[0-9][0-9])?[ ]*(am|pm)?[ ]*$/i
  )
  // m[0] // '1:30pm'
  // m[1] // '1'
  // m[2] // ':30'
  // m[3] // '30'
  // m[4] // undefined
  // m[5] // 'pm'
  // console.log(m)
  if (m) {
    if (m[1] === '12' && m[5]) {
      m[1] = '0'
    }
    if (m[5] === 'pm') {
      const hour = Number(m[1]) + 12
      m[1] = String(hour)
    }
    if (m[1].length === 1) {
      m[1] = '0' + m[1]
    }
    value = `${m[1]}:${m[3] ?? '00'}`
    return value
  }
  //. no match - error?
  return null
}
