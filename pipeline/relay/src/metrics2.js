// refactoring fns from metrics.js

// binning algorithms to calculate metrics

//. make this file a class so can have dim and value defs per class
//. instantiate one for each device?

// dimensionDefs
// if any one of these dimensions changes,
// start putting the time / count values in other bins.
// keyed on dataitem name, eg 'operator'.
//. move these into yaml, and have per client
//. might want these to be per device or device type also?
const dimensionDefs = {
  //. use hour1970, or minute1970?
  // day1970: {},
  year: {},
  dayOfYear: {},
  hour: {},
  minute: {}, //. do minute for testing, then switch to hour? but want to write every minute
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

// get accumulators for the given observations and starting points.
// observations is a list of observation objects with { dataitem_id, value, ... }
// dimensionsByDevice is a dict with the current values of the dimensions,
//   as defined in dimensionDefs, above, keyed on device_id.
// timersByDevice measures the time a dataitem is in a particular state.
//   it's a dictionary keyed on device_id, then the valueDefs keys, defined above.
// returns a dict of dicts keyed on device_id, then dimensions
//   (glommed together as json), then bin name.
//   eg {3: { '{"dayOfYear":284,"hour":2}': { time_active: 32 } } }
export function getAccumulatorsByDevice(
  observations,
  dimensionsByDevice,
  timersByDevice
) {
  // add hour, minute, dimensionKey, etc to each observation
  amendObservations(observations)
  console.log(observations)

  // bins for the current set of dimension values, for each device.
  // added to accumulator and cleared on each change of a dimension value.
  // keyed on device_id, then bin name.
  // will be like {3: { time_active: 8.1 }, ...} // device 3, 8.1 seconds
  const currentBinsByDevice = {}

  // accumulated bins for this calculation run - will return at end.
  // this is a dict of dicts of dicts - keyed on device_id, then dimensions
  // (glommed together as json), then bin name.
  // eg {3: { '{"dayOfYear":284,"hour":2}': { time_active: 32 } } }
  const accumulatorsByDevice = {}

  // run each observation through handler in order
  for (let observation of observations) {
    // only do observations with data names.
    // ie agent.xml dataitems should have name attribute.
    // note: this excludes the agent dataitems, which we don't care about (now).
    if (observation.name) {
      const { device_id } = observation

      // init dicts
      if (dimensionsByDevice[device_id] === undefined) {
        dimensionsByDevice[device_id] = {}
      }
      if (currentBinsByDevice[device_id] === undefined) {
        currentBinsByDevice[device_id] = {}
      }
      if (accumulatorsByDevice[device_id] === undefined) {
        accumulatorsByDevice[device_id] = {}
      }

      // narrow dicts down to this observation's device
      const dimensions = dimensionsByDevice[device_id]
      const currentBins = currentBinsByDevice[device_id]
      const accumulators = accumulatorsByDevice[device_id]

      // get
      const valueDeltas = getValueDeltas(
        observation,
        timersByDevice
        // deviceDimensions,
        // deviceAccumulators,
        // deviceBins,
        // timers
      )
      console.log(valueDeltas)

      const dimensionDeltas = getDimensionDeltas(currentBins, dimensions)
      console.log(dimensionDeltas)
    }
  }

  //. update calendartime
  // const currentTime = new Date().getTime()
  // accumulators.calendarTime = (currentTime - previousTime) * 0.001 // sec
  // previousTime = currentTime

  // return bins - will convert to sql and write to db
  return accumulatorsByDevice
}

// split observation time into year, dayofyear, hour, minute.
// exported for testing.
export function amendObservations(observations) {
  observations.forEach(observation => {
    const date = new Date(observation.timestamp)

    // convert iso timestamps to seconds since 1970-01-01
    observation.timestampSecs = date.getTime() * 0.001 // seconds

    // get current dimension values for each observation
    observation.year = date.getFullYear() // eg 2021
    observation.dayOfYear = getDayOfYear(date) // 1-366
    //. observation.day1970 = getDay1970(date) // days since 1970-01-01
    observation.hour = date.getHours() // 0-23
    observation.minute = date.getMinutes() // 0-59

    // // assign dimension key to observation
    // observation.binName = device_id + '-' + observation.name

    observation.dimensionKey = getDimensionKey(observation)
  })
}

// get sql statements to write given accumulator bin data to db.
// accumulators is like { device_id: bins }
//   with bins like { dimensions: accumulators }
//   dimensions are like "{operator:'Alice'}"
//   with accumulators like { time_active: 1, time_available: 2 }}
export function getSql(accumulators) {
  let sql = ''
  // iterate over device+bins
  // device_id is a db node_id, eg 3
  // bins is a dict like { dimensions: accumulators }
  for (let [device_id, bins] of Object.entries(accumulators)) {
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

      // iterate over accumulator slots, eg 'time_active', 'time_available'.
      for (let accumulatorSlot of accumulatorSlots) {
        // get total time accumulated for the slot
        const timeDelta = accumulators[accumulatorSlot]
        if (timeDelta > 0) {
          // add values one at a time to existing db records.
          // would be better to do all with one stmt somehow,
          // but it's already complex enough.
          // this is an upsert command pattern in postgres -
          // try to add a new record - if key is already there,
          // update existing record by adding timeDelta to the value.
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

// function getDimensionKey(dimensions) {
//   return JSON.stringify(dimensions)
// }
// get dimension key for an observation,
// eg '{"hour1970":1234567,"operator":"Alice"}'
function getDimensionKey(observation) {
  //. use hour1970
  // const { year, dayOfYear, hour, minute } = observation
  // const dimensions = { year, dayOfYear, hour, minute }
  const dimensions = {}
  for (let dimension of Object.keys(dimensionDefs)) {
    dimensions[dimension] = observation[dimension]
  }
  return JSON.stringify(dimensions)
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

//. getHour1970 - hours since 1970-01-01

//////////////////////////////////////////////////////////////

export function handleObservation(
  observation,
  dimensions,
  accumulators,
  currentBins,
  timers
  // valueDefs,
  // dimensionDefs
) {
  // get time deltas for observation value changes
  const valueDeltas = getValueDeltas(observation, timers)

  // apply time deltas to currentBins
  for (let bin of Object.keys(valueDeltas)) {
    const delta = valueDeltas[bin]
    if (currentBins[bin] === undefined) {
      currentBins[bin] = delta
    } else {
      currentBins[bin] += delta
    }
  }

  // get time deltas for dimension changes
  //. apply time deltas to accumulator bins, clear currentBins
  const dimensionDeltas = applyDimensionDeltas(
    observation,
    dimensions,
    accumulators,
    currentBins,
    dimensionDefs
  )
  console.log(dimensionDeltas)

  //. if time=minutechange then dump accum bins to db, clear them ?
}

// track changes to observation values and return time deltas.
// caller should then apply deltas to current bins.
// timers dictionary is modified in place to track start times for value changes.
// exported for testing.
//. was first part of handleObservation
export function getValueDeltas(observation, timers) {
  const deltas = {}

  //. add these to an amendObservations fn?
  // name might include deviceId/ - remove it to get dataname, eg 'availability'
  const dataname = observation.name.slice(observation.name.indexOf('/') + 1)
  // value might be eg 'Alice' for operator, 'ACTIVE' for execution, etc
  const { device_id, timestampSecs, value } = observation
  // get a unique key for timers
  // eg '3-availability'
  //. or make timers a dict of dicts, like currentBins
  const timerKey = device_id + '-' + dataname

  // if observation is something we're tracking the value of,
  // update start time or deltas dict.
  if (valueDefs[dataname]) {
    const valueDef = valueDefs[dataname] // eg { bin: 'time_active', when: 'ACTIVE' }
    const bin = valueDef.bin // eg 'time_active'

    // handle edge transition - start or stop timetracking for the value.
    // eg valueDef.when could be 'AVAILABLE' or 'ACTIVE' etc.
    if (value === valueDef.when) {
      // start 'timer' for this observation
      // add guard in case agent is defective and sends these out every time,
      // instead of just at start.
      if (!timers[timerKey]) {
        timers[timerKey] = timestampSecs
      }
    } else {
      // otherwise, observation is turning 'off' - add time delta to dict.
      //. caller will add them to currentBins.
      if (timers[timerKey]) {
        const timeDelta = timestampSecs - timers[timerKey] // sec
        if (deltas[bin] === undefined) {
          deltas[bin] = timeDelta
        } else {
          deltas[bin] += timeDelta
        }
        // reset start time
        timers[timerKey] = null
      }
    }
  }
  return deltas
}

//

// track changes to dimension values
export function applyDimensionDeltas(
  observation,
  dimensions,
  accumulators,
  currentBins,
  dimensionDefs
) {
  // name might include deviceId/ - remove it to get dataname, eg 'availability'
  const dataname = observation.name.slice(observation.name.indexOf('/') + 1)

  // value might be eg 'Alice' for operator, 'ACTIVE' for execution, etc
  // const { device_id, timestampSecs, year, dayOfYear, hour, minute, value } =
  const { year, dayOfYear, hour, minute, value } = observation
  // const { day1970, hour, minute, value } = observation //?

  //. instead of comparing each value below, make a dimensionKey
  // and compare it
  // const currentDimensionKey = JSON.stringify()
  // then, if anything changed, call getDimensionDeltas,
  // updateaccbins, clearcurrentbins, and clear all dimensions
  // if (currentDimensionKey !== previousDimensionKey) {}

  // year is a dimension we need to track
  if (year !== dimensions.year) {
    const dimensionDeltas = getDimensionDeltas(currentBins, dimensions)
    updateAccumulatorBins(accumulators, dimensionDeltas)
    clearCurrentBins(currentBins)
    updateDimensions(dimensions, 'year', year)
  }

  // dayOfYear (1-366) is a dimension we need to track
  if (dayOfYear !== dimensions.dayOfYear) {
    const dimensionDeltas = getDimensionDeltas(currentBins, dimensions)
    updateAccumulatorBins(accumulators, dimensionDeltas)
    clearCurrentBins(currentBins)
    updateDimensions(dimensions, 'dayOfYear', dayOfYear)
  }

  // hour (0-23) is a dimension we need to track
  if (hour !== dimensions.hour) {
    const dimensionDeltas = getDimensionDeltas(currentBins, dimensions)
    updateAccumulatorBins(accumulators, dimensionDeltas)
    clearCurrentBins(currentBins)
    updateDimensions(dimensions, 'hour', hour)
  }

  // minute (0-59) is a dimension we need to track
  if (minute !== dimensions.minute) {
    const dimensionDeltas = getDimensionDeltas(currentBins, dimensions)
    updateAccumulatorBins(accumulators, dimensionDeltas)
    clearCurrentBins(currentBins)
    updateDimensions(dimensions, 'minute', minute)
  }

  // check if this dataitem is a dimension we're tracking,
  // eg dataname = 'operator'.
  if (dimensionDefs[dataname]) {
    // if value changed, dump current bins to accumulator bins,
    // and update current value.
    if (value !== dimensions[dataname]) {
      const dimensionDeltas = getDimensionDeltas(currentBins, dimensions)
      updateAccumulatorBins(accumulators, dimensionDeltas)
      clearCurrentBins(currentBins)
      updateDimensions(dimensions, dataname, value)
    }
  }

  //.. how get rid of this?
  const dimensionDeltas = getDimensionDeltas(currentBins, dimensions)
  updateAccumulatorBins(accumulators, dimensionDeltas)
  clearCurrentBins(currentBins)
}

// iterate over bin keys, eg ['time_active', ...], and clear bins
export function clearCurrentBins(currentBins) {
  for (let binKey of Object.keys(currentBins)) {
    delete currentBins[binKey]
  }
}

// update current dimension value
function updateDimensions(dimensions, dataname, value) {
  dimensions[dataname] = value
}

// apply dimension deltas to accumulator bins
function updateAccumulatorBins(accumulators, dimensionDeltas) {
  // get key for this row, eg '{"dayOfYear":298, "hour":8, "minute":23}'
  // const dimensionKey = getDimensionKey(dimensions)
  // // start new dict if needed
  // if (accumulators[dimensionKey] === undefined) {
  //   accumulators[dimensionKey] = {}
  // }
  // // dump current bins to accumulator bins, then clear them.
  // // do this so can dump all accumulator bins to db in one go, at end.
  // const acc = accumulators[dimensionKey] // eg { time_active: 19.3 } // secs
  // // iterate over bin keys, eg ['time_active', ...]
  // for (let binKey of Object.keys(currentBins)) {
  //   if (acc[binKey] === undefined) {
  //     acc[binKey] = currentBins[binKey]
  //   } else {
  //     acc[binKey] += currentBins[binKey]
  //   }
  //   // clear the bin
  //   delete currentBins[binKey]
  // }
}

// get deltas when a dimension value changes.
// return dict of accumulator and dimvalues to change.
// caller should dump current bins into accumulator bins,
// and update current dimension value.
export function getDimensionDeltas(currentBins, dimensions) {
  let deltas = {}

  // get key for this row, eg '{"dayOfYear":298, "hour":8, "minute":23}'
  // const dimensionKey = getDimensionKey(dimensions)
  const dimensionKey = JSON.stringify(dimensions)

  // start new dict if needed
  // if (accumulators[dimensionKey] === undefined) {
  //   accumulators[dimensionKey] = {}
  // }
  if (deltas[dimensionKey] === undefined) {
    deltas[dimensionKey] = {}
  }

  // dump current bins to accumulator bins, then clear them.
  // do this so can dump all accumulator bins to db in one go, at end.
  // const accumulator = accumulators[dimensionKey] // eg { time_active: 19.3 } // secs
  const accumulator = deltas[dimensionKey] // eg { time_active: 19.3 } // secs

  // iterate over bin keys, eg ['time_active', ...]
  for (let binKey of Object.keys(currentBins)) {
    if (accumulator[binKey] === undefined) {
      accumulator[binKey] = currentBins[binKey]
    } else {
      accumulator[binKey] += currentBins[binKey]
    }
  }

  return deltas
}
