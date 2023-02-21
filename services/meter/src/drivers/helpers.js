// helper fns for drivers
// run 'node helpers-test.js' for tests
//. move into common lib later

// get today's date as string, eg '2023-02-15'
// use timezone offset so we get the LOCAL day, not UTC day
export function getTodayLocal(timeZone) {
  // this handles daylight savings
  // swe is sweden - iso time format
  return new Date().toLocaleDateString('swe', { timeZone })
}

// get downtimes from day like '2023-02-18' and text like '10:00am,10\n2:00pm,10'
// into array like [{ start, stop }, ...], where start and stop are Date objects with Z timezone.
// returns null if there are any syntax errors.
export function getDowntimes(day, text) {
  if (!text) return []
  const lines = text.split('\n')
  const downtimes = lines.map(line => {
    let [startTime, mins] = line.split(',') // eg ['3:00pm', '10']
    startTime = sanitizeTime(startTime) // eg '15:00'
    if (startTime === null) {
      return null
    }
    if (!Number(mins)) {
      return null
    }
    const startDateTime = day + 'T' + startTime // eg '2023-02-17T15:00' // local time - no Z
    const start = new Date(startDateTime) // eg 2023-02-17T21:00:00Z - with Z
    const stop = new Date(start.getTime() + Number(mins) * 60 * 1000) // eg 2023-02-17T21:10:00Z
    return { start, stop }
  })
  return downtimes.some(downtime => downtime === null) ? null : downtimes
}

// sanitize time - convert anything to 24h format
// eg '1pm' -> '13:00', '9' -> '09:00', '15:00:00' -> '15:00'
export function sanitizeTime(value) {
  const m = value.match(
    /^([0-9]?[0-9])(:([0-9][0-9]))?(:[0-9][0-9])?[ ]*(am|pm)?[ ]*$/i
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

// is the current time during a shift, and not during a downtime or holiday?
// now is a Date object, schedule is { start, stop, holiday, downtimes },
// where downtimes is an array of { start, stop } Date objects.
export function getIsDuringShift(now, schedule) {
  if (schedule.holiday) {
    console.log('on holiday')
    return false
  }
  for (let downtime of schedule.downtimes || []) {
    const { start, stop } = downtime
    console.log('checking downtime', start, stop)
    if (now >= start && now <= stop) {
      console.log('in downtime')
      return false
    }
  }
  if (now >= schedule.start && now <= schedule.stop) {
    console.log('in shift')
    return true
  }
  // const isDuringShift = now >= schedule.start && now <= schedule.stop
  // return isDuringShift
  return false
}
