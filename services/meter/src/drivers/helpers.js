// helper fns for drivers
//. move into common lib later

// get today's date in local (not Z) timezone, eg '2022-01-16'.
// normally, new Date() would return a date in UTC timezone,
// which could be the following day - so need to offset with timezoneOffset.
export function getTodayLocal() {
  const timezoneOffsetMs = new Date().getTimezoneOffset() * 60 * 1000 // minutes to msec
  return new Date(new Date().getTime() - timezoneOffsetMs)
    .toISOString()
    .slice(0, 10)
}

// get downtimes from text like '10:00am,10\n2:00pm,10'
// into array like [{ start, stop }, ...],
// where start and stop are Date objects.
export function getDowntimes(text) {
  if (!text) return []
  const today = getTodayLocal() // eg '2023-02-17'
  const timezoneOffsetMs = new Date().getTimezoneOffset() * 60 * 1000 // minutes to msec
  const lines = text.split('\n')
  const downtimes = lines.map(line => {
    let [startTime, mins] = line.split(',') // eg ['3:00pm', '10']
    startTime = sanitizeTime(startTime) // eg '15:00'
    const startDateTime = today + 'T' + startTime // eg '2023-02-17T15:00' // local time - no Z
    // const start = new Date(new Date(startDateTime).getTime() + timezoneOffsetMs) // eg 2023-02-17T21:00:00Z - with Z
    const start = new Date(startDateTime) // eg 2023-02-17T21:00:00Z - with Z
    const stop = new Date(start.getTime() + Number(mins) * 60 * 1000) // eg 2023-02-17T21:10:00Z
    return { start, stop }
  })
  return downtimes
}

// sanitize time - convert anything to 24h format
// eg '1pm' -> '13:00', '9' -> '09:00', '15:00:00' -> '15:00'
export function sanitizeTime(value) {
  const m = value.match(
    /([0-9]?[0-9])(:([0-9][0-9]))?(:[0-9][0-9])?[ ]*(am|pm)?/i
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
    value = `${m[1]}:${m[3] ?? '00'}`
    return value
  }
  //. no match - error
  return null
}
