// refactoring fns from metrics.js

export function handleObservation(
  observation,
  dimensions,
  accumulatorBins,
  currentBins,
  timers,
  valueDefs
) {
  const valueDeltas = getValueDeltas(observation, timers, valueDefs)
  // apply deltas to currentBins
  for (let bin of Object.keys(valueDeltas)) {
    const delta = valueDeltas[bin]
    if (currentBins[bin] === undefined) {
      currentBins[bin] = delta
    } else {
      currentBins[bin] += delta
    }
  }
}

// track changes to observation values and return time deltas.
// caller should then apply deltas to current bins.
// timers dictionary is modified in place to track start times for value changes.
// exported for testing.
//. was first part of handleObservation
export function getValueDeltas(observation, timers, valueDefs) {
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
export function getDimensionDeltas(
  observation,
  dimensions,
  accumulatorBins,
  currentBins,
  dimensionDefs
) {
  const deltas = {}

  // name might include deviceId/ - remove it to get dataname, eg 'availability'
  const dataname = observation.name.slice(observation.name.indexOf('/') + 1)

  // value might be eg 'Alice' for operator, 'ACTIVE' for execution, etc
  // const { device_id, timestampSecs, year, dayOfYear, hour, minute, value } =
  const { year, dayOfYear, hour, minute, value } = observation

  // year is a dimension we need to track
  if (year !== dimensions.year) {
    const foo = getDeltas(currentBins, dimensions, 'year', year)
    applyFoo(accumulatorBins, foo)
    clearCurrentBins(currentBins)
  }

  // dayOfYear (1-366) is a dimension we need to track
  if (dayOfYear !== dimensions.dayOfYear) {
    const foo = getDeltas(currentBins, dimensions, 'dayOfYear', dayOfYear)
    applyFoo(accumulatorBins, foo)
    clearCurrentBins(currentBins)
  }

  // hour (0-23) is a dimension we need to track
  if (hour !== dimensions.hour) {
    const foo = getDeltas(currentBins, dimensions, 'hour', hour)
    applyFoo(accumulatorBins, foo)
    clearCurrentBins(currentBins)
  }

  // minute (0-59) is a dimension we need to track
  if (minute !== dimensions.minute) {
    const foo = getDeltas(currentBins, dimensions, 'minute', minute)
    applyFoo(accumulatorBins, foo)
    clearCurrentBins(currentBins)
  }

  // check if this dataitem is a dimension we're tracking,
  // eg dataname = 'operator'.
  if (dimensionDefs[dataname]) {
    // if value changed, dump current bins to accumulator bins,
    // and update current value.
    if (value !== dimensions[dataname]) {
      const foo = getDeltas(currentBins, dimensions, dataname, value)
      applyFoo(accumulatorBins, foo)
      clearCurrentBins(currentBins)
    }
  }

  //.. how get rid of this?
  const foo = getDeltas(
    // accumulatorBins,
    currentBins,
    dimensions
    //. undefined, undefined
  )
  console.log(foo)
  applyFoo(accumulatorBins, foo)
  clearCurrentBins(currentBins)

  return deltas
}

export function applyFoo(accumulatorBins, foo) {}

// iterate over bin keys, eg ['time_active', ...], and clear bins
export function clearCurrentBins(currentBins) {
  for (let binKey of Object.keys(currentBins)) {
    delete currentBins[binKey]
  }
}

// ---------------------------------------------------------------------

// update current dimension value
function updateDimensions(dimensions, dataname, value) {
  dimensions[dataname] = value
}

// get deltas when a dimension value changes.
// return dict of accumulator and dimvalues to change.
//// dump current bins into accumulator bins,
//// and update current dimension value.
export function getDeltas(currentBins, dimensions, dataname, value) {
  let foo = {}

  // get key for this row, eg '{"dayOfYear":298, "hour":8, "minute":23}'
  // const dimensionKey = getDimensionKey(dimensions)
  const dimensionKey = JSON.stringify(dimensions)

  // start new dict if needed
  // if (accumulatorBins[dimensionKey] === undefined) {
  //   accumulatorBins[dimensionKey] = {}
  // }
  if (foo[dimensionKey] === undefined) {
    foo[dimensionKey] = {}
  }

  // dump current bins to accumulator bins, then clear them.
  // do this so can dump all accumulator bins to db in one go, at end.
  // const accumulator = accumulatorBins[dimensionKey] // eg { time_active: 19.3 } // secs
  const accumulator = foo[dimensionKey] // eg { time_active: 19.3 } // secs

  // iterate over bin keys, eg ['time_active', ...]
  for (let binKey of Object.keys(currentBins)) {
    if (accumulator[binKey] === undefined) {
      accumulator[binKey] = currentBins[binKey]
    } else {
      accumulator[binKey] += currentBins[binKey]
    }
    // // clear the bin
    // delete currentBins[binKey]
  }

  // // update current dimension value
  // dimensions[dataname] = value

  return foo
}
