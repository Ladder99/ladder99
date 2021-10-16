// binning algorithms to calculate metrics

// dimensionDefs
// if any one of these dimensions changes,
// start putting the time / count values in other bins.
// keyed on dataitem name, eg 'operator'.
//. move these into yaml, and have per client
//. might want these to be per device or device type also?
const dimensionDefs = {
  minute: {}, //. do minute for testing, then switch to hour? but want to write every minute
  // hour: {},
  // add these as needed, to be able to slice reports later
  // operator: {},
  // machine: {},
  // component: {},
  // job: {},
  // operation: {},
}

// valueDefs
// dataitems that we want to track the state of.
// will track time the dataitem spends in the 'when' state,
// and add it to the given 'bin'.
// keyed on dataitem / observation name, ie NOT the dataitem id.
// so in the agent.xml, DO NOT include the deviceId in the names,
// just have a plain descriptor.
//. move these into yaml, and have per client
//. might want these to be per device or device type also
const valueDefs = {
  availability: {
    when: 'AVAILABLE',
    bin: 'time_available',
  },
  execution_state: {
    when: 'ACTIVE',
    bin: 'time_active',
  },
}

//

// get accumulatorBins for the given observations and starting points.
// observations is a list of observation objects with { dataitem_id, value, ... }
// currentDimensions is a dict with the current values of the dimensions,
//   as defined in dimensionDefs, above.
// startTimes measures the time a dataitem is in a particular state.
//   it's a dictionary keyed on the valueDefs keys, defined above.
// returns a dict of dicts
export function getAccumulatorBins(
  observations,
  currentDimensions,
  startTimes
) {
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
    // note: this excludes the agent dataitems, which we don't care about (now).
    if (observation.name) {
      const { device_id } = observation
      // init dicts
      if (currentDimensions[device_id] === undefined) {
        currentDimensions[device_id] = {}
      }
      if (currentBins[device_id] === undefined) {
        currentBins[device_id] = {}
      }
      if (accumulatorBins[device_id] === undefined) {
        accumulatorBins[device_id] = {}
      }
      // narrow dicts down to this observation's device
      const deviceDimensionValues = currentDimensions[device_id]
      const deviceCurrentBins = currentBins[device_id]
      const deviceAccumulatorBins = accumulatorBins[device_id]
      // handle the observation by dumping time deltas to accumulator bins.
      handleObservation(
        observation,
        deviceDimensionValues,
        deviceAccumulatorBins,
        deviceCurrentBins,
        startTimes
      )
    }
  }

  //. update calendartime
  // const currentTime = new Date().getTime()
  // accumulatorBins.calendarTime = (currentTime - previousTime) * 0.001 // sec
  // previousTime = currentTime

  // return bins - will convert to sql and write to db
  return accumulatorBins
}

// split observation time into year, dayofyear, hour, minute
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
  })
}

// handle one observation.
// check for changes to dimensions and state changes we want to track.
// modifies currentDimensions, etc in place.
// exported for testing.
export function handleObservation(
  observation,
  currentDimensions,
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
        const timeDelta = timestampSecs - startTimes[deviceDataName] // sec
        if (currentBins[bin] === undefined) {
          currentBins[bin] = timeDelta
        } else {
          currentBins[bin] += timeDelta
        }
        // reset start time
        startTimes[deviceDataName] = null
      }
    }
  }

  // year is a dimension we need to track
  if (year !== currentDimensions.year) {
    dimensionValueChanged(
      accumulatorBins,
      currentBins,
      currentDimensions,
      'year',
      year
    )
  }
  // dayOfYear (1-366) is a dimension we need to track
  if (dayOfYear !== currentDimensions.dayOfYear) {
    dimensionValueChanged(
      accumulatorBins,
      currentBins,
      currentDimensions,
      'dayOfYear',
      dayOfYear
    )
  }

  // hour (0-23) is a dimension we need to track
  if (hour !== currentDimensions.hour) {
    dimensionValueChanged(
      accumulatorBins,
      currentBins,
      currentDimensions,
      'hour',
      hour
    )
  }

  // minute (0-59) is a dimension we need to track
  if (minute !== currentDimensions.minute) {
    dimensionValueChanged(
      accumulatorBins,
      currentBins,
      currentDimensions,
      'minute',
      minute
    )
  }

  // check if this dataitem is a dimension we're tracking,
  // eg dataname = 'operator'.
  if (dimensionDefs[dataname]) {
    // if value changed, dump current bins to accumulator bins,
    // and update current value.
    if (value !== currentDimensions[dataname]) {
      dimensionValueChanged(
        accumulatorBins,
        currentBins,
        currentDimensions,
        dataname,
        value
      )
    }
  }

  //.. get rid of this
  dimensionValueChanged(
    accumulatorBins,
    currentBins,
    currentDimensions
    //. undefined, undefined
  )
}

// a dimension value changed - dump current bins into accumulator bins,
// and update current dimension value.
function dimensionValueChanged(
  accumulatorBins,
  currentBins,
  currentDimensions,
  dataname,
  value
) {
  // get key for this row, eg '{dayOfYear:298, hour:8, minute:23}'
  const dimensionKey = getDimensionKey(currentDimensions)

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
  currentDimensions[dataname] = value
}

// get sql statements to write given accumulator bin data to db.
// accumulatorBins is like { device_id: bins }
//   with bins like { dimensions: accumulators }
//   dimensions are like "{operator:'Alice'}"
//   with accumulators like { time_active: 1, time_available: 2 }}
export function getSql(accumulatorBins) {
  let sql = ''
  // iterate over device+bins
  // device_id is a db node_id, eg 3
  // bins is a dict like { dimensions: accumulators }
  for (let [device_id, bins] of Object.entries(accumulatorBins)) {
    // iterate over dimensions+accumulators
    // dimensions is eg '{"operator":"Alice", ...}' - ie gloms dimensions+values together
    // accumulators is eg { time_active: 1, time_available: 2, ... },
    //   ie all the accumulator slots and their time values in seconds.
    for (let [dimensions, accumulators] of Object.entries(bins)) {
      const accumulatorSlots = Object.keys(accumulators) // eg ['time_active', 'time_available']
      if (accumulatorSlots.length === 0) continue // skip if no data
      // split dimensions into dimensions+values and get associated time.
      const dims = splitDimensionKey(dimensions) // eg to {operator: 'Alice'}
      const seconds1970 = getHourInSeconds(dims) // rounded to hour, in seconds
      if (!seconds1970) continue // skip if got NaN or something
      const timestring = new Date(seconds1970 * 1000).toISOString() // eg '2021-10-15T11:00:00Z"
      // add values one at a time to existing db records.
      // would be better to do all with one stmt somehow,
      // but it's already complex enough.
      for (let accumulatorSlot of accumulatorSlots) {
        const timeDelta = accumulators[accumulatorSlot]
        if (timeDelta > 0) {
          // this is an upsert command pattern in postgres -
          // tries to add a new record - if key is already there,
          // updates existing record by adding timeDelta to the value.
          sql += `
INSERT INTO bins (device_id, time, dimensions, values)
  VALUES (${device_id}, '${timestring}', 
    '${dimensions}'::jsonb,
    '{"${accumulatorSlot}":${timeDelta}}'::jsonb)
ON CONFLICT (device_id, time, dimensions) DO
  UPDATE SET
    values = bins.values ||
      jsonb_build_object('${accumulatorSlot}', 
        (coalesce((bins.values->>'${accumulatorSlot}')::real, 0.0::real) + ${timeDelta}));
  `
        }
      }
    }
  }
  return sql
}

// helper fns

function getDimensionKey(currentDimensions) {
  return JSON.stringify(currentDimensions)
}
export function splitDimensionKey(dimensionKey) {
  return JSON.parse(dimensionKey)
}

const secondsPerDay = 24 * 60 * 60
const secondsPerHour = 60 * 60
// const secondsPerMinute = 60
const daysPerMillisecond = 1 / (secondsPerDay * 1000)

// get day of year, 1-366
// from stackoverflow
function getDayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 0)
  const diff =
    date.getTime() -
    start.getTime() +
    (start.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000
  const day = Math.floor(diff * daysPerMillisecond)
  return day
}

// get hour given year, dayOfYear, hour, and minute - in seconds since 1970
// export function getHourInSeconds(dims) {
//   const base = new Date(dims.year, 0, 1).getTime() * 0.001
//   const seconds =
//     base +
//     (dims.dayOfYear - 1) * secondsPerDay +
//     dims.hour * secondsPerHour +
//     dims.minute * secondsPerMinute
//   return seconds
// }
export function getHourInSeconds(dims) {
  const base = new Date(dims.year, 0, 1).getTime() * 0.001
  const seconds =
    base + (dims.dayOfYear - 1) * secondsPerDay + dims.hour * secondsPerHour
  return seconds
}
