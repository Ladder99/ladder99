// refactoring fns from metrics.js

// get time deltas for one observation.
// check for changes to dimensions AND state changes we want to track.
// returns deltas for caller to apply to bins.
// exported for testing.
export function getDeltas(
  observation,
  dimensions,
  accumulatorBins,
  currentBins,
  timers,
  valueDefs,
  dimensionDefs
) {
  const deltas = {}

  // name might include deviceId/ - remove it to get dataname, eg 'availability'
  const dataname = observation.name.slice(observation.name.indexOf('/') + 1)

  // value might be eg 'Alice' for operator, 'ACTIVE' for execution, etc
  const { device_id, timestampSecs, year, dayOfYear, hour, minute, value } =
    observation

  // get a unique key for timers
  // eg '3-availability'
  //. or make timers a dict of dicts, like currentBins
  const timerKey = device_id + '-' + dataname

  // track changes to STATES

  // if observation is something we're tracking the state of,
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
      // caller will add them to currentBins.
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

  // track changes to DIMENSIONS

  // year is a dimension we need to track
  if (year !== dimensions.year) {
    const foo = getFoo(accumulatorBins, currentBins, dimensions, 'year', year)
  }

  // dayOfYear (1-366) is a dimension we need to track
  if (dayOfYear !== dimensions.dayOfYear) {
    const foo = getFoo(
      accumulatorBins,
      currentBins,
      dimensions,
      'dayOfYear',
      dayOfYear
    )
  }

  // hour (0-23) is a dimension we need to track
  if (hour !== dimensions.hour) {
    const foo = getFoo(accumulatorBins, currentBins, dimensions, 'hour', hour)
  }

  // minute (0-59) is a dimension we need to track
  if (minute !== dimensions.minute) {
    const foo = getFoo(
      accumulatorBins,
      currentBins,
      dimensions,
      'minute',
      minute
    )
  }

  // check if this dataitem is a dimension we're tracking,
  // eg dataname = 'operator'.
  if (dimensionDefs[dataname]) {
    // if value changed, dump current bins to accumulator bins,
    // and update current value.
    if (value !== dimensions[dataname]) {
      const foo = getFoo(
        accumulatorBins,
        currentBins,
        dimensions,
        dataname,
        value
      )
    }
  }

  //.. how get rid of this?
  const foo = getFoo(
    accumulatorBins,
    currentBins,
    dimensions
    //. undefined, undefined
  )

  return deltas
}

// ---------------------------------------------------------------------

// a dimension value changed
// dump current bins into accumulator bins,
// and update current dimension value.
// return dict of accumulator and dimvalues to change.
export function getFoo(
  accumulatorBins,
  currentBins,
  dimensions,
  dataname,
  value
) {
  let foo = {}

  // get key for this row, eg '{"dayOfYear":298, "hour":8, "minute":23}'
  // const dimensionKey = getDimensionKey(dimensions)
  const dimensionKey = JSON.stringify(dimensions)

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
  dimensions[dataname] = value

  return foo
}
