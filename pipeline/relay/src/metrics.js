//

// dimensionDefs
// if any one of these changes, start putting the time/count values in other bins.
// keyed on dataitem/observation name.
//. move these into yaml, and have per client
//. might want these to be per device or device type also
const dimensionDefs = {
  minute: {}, //. do minute for testing, then switch to hour
  // hour: {},
  // operator: {},
  // machine: {},
  // component: {},
  // job: {},
  // operation: {},
}

// valueDefs
// dataitems that we want to track the state of.
// will track time the dataitem spends in the 'when' state.
// keyed on dataitem / observation name.
// the bin name should match the column in the bins table,
// as set in the migrations/*.sql files. (though will move to a values jsonb field)
//. move these into yaml, and have per client
//. might want these to be per device or device type also
const valueDefs = {
  //. calendar: { bin: 'time_calendar' } is implicit? make explicit?
  availability: {
    bin: 'time_available',
    when: 'AVAILABLE',
  },
  // execution: {
  execution_state: {
    bin: 'time_active',
    when: 'ACTIVE',
  },
}

//

// get accumulatorBins for the given observations and starting points.
export function getMetrics(observations, currentDimensionValues, startTimes) {
  // get hour, minute, etc for each observation
  assignTimesToObservations(observations)

  // bins for the current set of dimension values, for each device.
  // added to accumulator and cleared on each change of a dimension value.
  // keyed on device_id, then bin name.
  // will be like {3: { time_active: 8.1 }, ...} // device 3, 8.1 seconds
  const currentBins = {}

  // accumulated bins for this calculation run - will return at end.
  // this is a dict of dicts of dicts - keyed on device_id, then dimensions
  // (glommed together as json), then bin name.
  // eg {3: { '{"dayOfYear":284,"hour":2}': { time_active: 32 } } }
  const accumulatorBins = {}

  // run each observation through handler in order
  for (let observation of observations) {
    // only do observations with data names.
    // ie agent.xml dataitems should have name attribute.
    // this excludes the agent dataitems.
    if (observation.name) {
      const { device_id } = observation
      if (currentDimensionValues[device_id] === undefined) {
        currentDimensionValues[device_id] = {}
      }
      if (currentBins[device_id] === undefined) {
        currentBins[device_id] = {}
      }
      if (accumulatorBins[device_id] === undefined) {
        accumulatorBins[device_id] = {}
      }
      const deviceDimensionValues = currentDimensionValues[device_id]
      const deviceCurrentBins = currentBins[device_id]
      const deviceAccumulatorBins = accumulatorBins[device_id]
      handleObservation(
        observation,
        deviceDimensionValues,
        deviceAccumulatorBins,
        deviceCurrentBins,
        startTimes
      )
    }
  }

  // console.log('currentDimensionValues', currentDimensionValues)
  // console.log('currentDeviceBins', currentDeviceBins)
  // console.log('accumulatorBins', accumulatorBins)
  // console.log('startTimes', startTimes)
  // console.log()

  //. update calendartime
  // const currentTime = new Date().getTime()
  // accumulatorBins.calendarTime = (currentTime - previousTime) * 0.001 // sec
  // previousTime = currentTime

  // return bins - will convert to sql and write to db
  return accumulatorBins
}

//

function getDimensionKey(currentDimensionValues) {
  return JSON.stringify(currentDimensionValues)
}
export function splitDimensionKey(dimensionKey) {
  return JSON.parse(dimensionKey)
}

function getDayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 0)
  const diff =
    date.getTime() -
    start.getTime() +
    (start.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000
  const oneDay = 60 * 60 * 24 * 1000
  const day = Math.floor(diff / oneDay)
  return day
}

function assignTimesToObservations(observations) {
  observations.forEach(observation => {
    const date = new Date(observation.timestamp)

    // convert iso timestamps to seconds since 1970-01-01
    observation.timestampSecs = date.getTime() * 0.001 // seconds

    // get current dimension values for each observation
    observation.year = date.getFullYear() // eg 2021
    observation.dayOfYear = getDayOfYear(date) // 1-366
    observation.hour = date.getHours() // 0-23
    observation.minute = date.getMinutes() // 0-59
    //. etc - or like this?
    // observation.slices = {
    //   hour: date.getHours(), // 0-23
    //   minute: date.getMinutes(), // 0-59
    // }
  })
}

// handle one observation.
// check for changes to dimensions and state changes we want to track.
// modifies currentDimensionValues, etc in place.
// exported for testing.
export function handleObservation(
  observation,
  currentDimensionValues,
  accumulatorBins,
  currentBins,
  startTimes
) {
  // name might include deviceId/ - remove it to get dataname, eg 'availability'
  const dataname = observation.name.slice(observation.name.indexOf('/') + 1)

  // value is eg 'Alice' for operator, 'ACTIVE' for execution, etc
  const { device_id, timestampSecs, year, dayOfYear, hour, minute, value } =
    observation

  //. or make startTimes a dict of dicts, like currentBins
  const deviceDataName = device_id + dataname

  // if observation is something we're tracking the state of,
  // update start time or current bin.
  if (valueDefs[dataname]) {
    const valueDef = valueDefs[dataname] // eg { bin: 'time_active', when: 'ACTIVE' }
    const bin = valueDef.bin // eg 'time_active'

    // handle edge transition - start or stop timetracking for the value.
    // eg valueDef.when could be 'AVAILABLE' or 'ACTIVE' etc.
    if (value === valueDef.when) {
      // start 'timer' for this observation
      // add guard in case agent is defective and sends these out every time,
      // instead of just at start.
      if (!startTimes[deviceDataName]) {
        startTimes[deviceDataName] = timestampSecs
      }
    } else {
      // otherwise, observation is turning 'off' -
      // dump the time to the device's current bin.
      if (startTimes[deviceDataName]) {
        const delta = timestampSecs - startTimes[deviceDataName] // sec
        if (currentBins[bin] === undefined) {
          currentBins[bin] = delta
        } else {
          currentBins[bin] += delta
        }
        // reset start time
        startTimes[deviceDataName] = null
      }
    }
  }

  // year is a dimension we need to track
  if (year !== currentDimensionValues.year) {
    dimensionValueChanged(
      accumulatorBins,
      currentBins,
      currentDimensionValues,
      'year',
      year
    )
  }
  // dayOfYear (1-366) is a dimension we need to track
  if (dayOfYear !== currentDimensionValues.dayOfYear) {
    dimensionValueChanged(
      accumulatorBins,
      currentBins,
      currentDimensionValues,
      'dayOfYear',
      dayOfYear
    )
  }

  // hour (0-23) is a dimension we need to track
  if (hour !== currentDimensionValues.hour) {
    dimensionValueChanged(
      accumulatorBins,
      currentBins,
      currentDimensionValues,
      'hour',
      hour
    )
  }

  // minute (0-59) is a dimension we need to track
  if (minute !== currentDimensionValues.minute) {
    dimensionValueChanged(
      accumulatorBins,
      currentBins,
      currentDimensionValues,
      'minute',
      minute
    )
  }

  // check if this dataitem is a dimension we're tracking,
  // eg dataname = 'operator'.
  if (dimensionDefs[dataname]) {
    // if value changed, dump current bins to accumulator bins,
    // and update current value.
    if (value !== currentDimensionValues[dataname]) {
      dimensionValueChanged(
        accumulatorBins,
        currentBins,
        currentDimensionValues,
        dataname,
        value
      )
    }
  }

  //.. get rid of this
  dimensionValueChanged(
    accumulatorBins,
    currentBins,
    currentDimensionValues
    //. undefined, undefined
  )
}

// a dimension value changed - dump current bins into accumulator bins,
// and update current dimension value.
function dimensionValueChanged(
  accumulatorBins,
  currentBins,
  currentDimensionValues,
  dataname,
  value
) {
  // get key for this row, eg '{dayOfYear:298, hour:8, minute:23}'
  const dimensionKey = getDimensionKey(currentDimensionValues)

  // start new dict if needed
  if (accumulatorBins[dimensionKey] === undefined) {
    accumulatorBins[dimensionKey] = {}
  }

  // dump current bins to accumulator bins, then clear them.
  // do this so can dump all accumulator bins to db in one go, at end.
  const acc = accumulatorBins[dimensionKey] // eg { time_active: 19.3 } // secs

  // iterate over bin keys, eg ['time_active', ...]
  for (let binKey of Object.keys(currentBins)) {
    if (acc[binKey] === undefined) {
      acc[binKey] = currentBins[binKey]
    } else {
      acc[binKey] += currentBins[binKey]
    }
    // clear the bin
    delete currentBins[binKey]
  }

  // update current dimension value
  currentDimensionValues[dataname] = value
}

export function getSql(accumulatorBins) {
  let sql = ''
  const device_ids = Object.keys(accumulatorBins)
  for (let device_id of device_ids) {
    const bins = accumulatorBins[device_id]
    const keys = Object.keys(bins)
    for (let key of keys) {
      const acc = bins[key] // eg { time_active: 1 }
      const valueKeys = Object.keys(acc)
      if (valueKeys.length === 0) continue //.

      // split key into dimensions+values
      const dims = splitDimensionKey(key) // eg { operator: 'Alice' }

      const seconds1970 = getHourInSeconds(dims)
      if (seconds1970) {
        const time = new Date(seconds1970 * 1000).toISOString()
        // get bin for this key
        // if (acc.time_available) {
        // sql += `INSERT INTO bins_raw (device_id, time, dimensions, time_available) `
        // sql += `VALUES (${device_id}, '${time}', '${key}'::jsonb, ${acc.time_available}) `
        // sql += `ON CONFLICT (device_id, time, dimensions) DO `
        // sql += `UPDATE SET time_available = EXCLUDED.time_available + bins_raw.time_available;`
        // }
        const vals = {}
        const updates = []
        for (let valueKey of valueKeys) {
          const delta = acc[valueKey]
          if (delta > 0) {
            vals[valueKey] = delta
            updates.push(
              // `time_available = EXCLUDED.time_available + bins_raw.time_available`
              `vals->>'${valueKey}' = EXCLUDED.vals->>'${valueKey}' + (bins_raw.vals->>'${valueKey}' | 0)`
            )
          }
        }
        if (updates.length > 0) {
          const valsStr = JSON.stringify(vals)
          sql += `
INSERT INTO bins_raw (device_id, time, dimensions, vals)
  VALUES (${device_id}, '${time}', '${key}'::jsonb, '${valsStr}'::jsonb)
ON CONFLICT (device_id, time, dimensions) DO
  UPDATE SET ${updates.join(', ')};`
        }
      }
    }
  }
  return sql
}

// const secondsPerYear = 365.25 * 24 * 60 * 60
const secondsPerDay = 24 * 60 * 60
const secondsPerHour = 60 * 60
const secondsPerMinute = 60

//. do tdd and get this working exactly
export function getHourInSeconds(dims) {
  // console.log(dims)
  const base = new Date(dims.year, 0, 1).getTime() * 0.001
  // console.log(base)
  const seconds =
    // (dims.year - 1970) * secondsPerYear +
    base +
    (dims.dayOfYear - 1) * secondsPerDay +
    dims.hour * secondsPerHour +
    dims.minute * secondsPerMinute
  // const d = new Date(dims.year, dims.month, dims.date, dims.hours, dims.minutes)
  // const e = new Date()
  return seconds
}
