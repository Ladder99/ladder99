// see dataObservations - bring over here

//. move these into yaml, and have per client

// dimensionDefs
// if any one of these changes, start putting the time/count values in other bins.
// keyed on dataitem/observation name.
const dimensionDefs = {
  // hour: {}, //. okay? what if some need higher resolution? eg minute? save for future
  minute: {}, //.
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
const valueDefs = {
  availability: {
    bin: 'timeAvailable',
    when: 'AVAILABLE',
  },
  // execution: {
  execution_state: {
    bin: 'timeActive',
    when: 'ACTIVE',
  },
}

//

export function updateMetrics(
  db,
  observations,
  currentDimensionValues,
  startTimes
) {
  // assignTimesToObservations()
  observations.forEach(observation => {
    const date = new Date(observation.timestamp)

    // convert iso timestamps to seconds since 1970-01-01
    observation.timestampSecs = date.getTime() * 0.001 // seconds

    // get current dimension values for each observation
    observation.hour = date.getHours() // 0-23
    observation.minute = date.getMinutes() // 0-59
    observation.dayOfYear = getDayOfYear(date) // 1-366
    //. etc - or like this eventually
    // observation.slices = {
    //   hour: date.getHours(), // 0-23
    //   minute: date.getMinutes(), // 0-59
    // }
  })

  // accumulated bins for this calculation run - will add to db at end.
  // this is a dict of dicts - keyed on dimensions (glommed together),
  // then bin name.
  // eg { '{"dayOfYear":284,"hour":2,"minute":29}': { timeActive: 32 } }
  const accumulatorBins = {}

  // bins for the current set of dimension values.
  // added to accumulator and cleared on each change of a dimension value.
  // keyed on bin name.
  // will be like { timeActive: 8.1 } // seconds
  const currentBins = {}

  // for (let observation of this.observations) {
  //   if (!observation.name) continue // skip observations without data names (ie agent.xml dataitems should have name attribute)

  //   // name might include machineId/ - remove it to get dataname, eg 'availability'
  //   const dataname = observation.name.slice(observation.name.indexOf('/') + 1)

  //   // value is eg 'Alice' for operator, 'ACTIVE' for execution, etc
  //   // const { timestampSecs, dayOfYear, hour, value } = observation
  //   const { timestampSecs, dayOfYear, hour, minute, value } = observation

  //   // if observation is something we need to track the lifespan of,
  //   // update start time or current bin.
  //   if (valueDefs[dataname]) {
  //     const valueDef = valueDefs[dataname] // eg { bin: 'timeActive', when: 'ACTIVE' }
  //     const bin = valueDef.bin // eg 'timeActive'

  //     // handle edge transition - start or stop timetracking for the value.
  //     // eg valueDef.when could be 'AVAILABLE' or 'ACTIVE' etc.
  //     if (value === valueDef.when) {
  //       // start 'timer' for this observation
  //       // add guard in case agent is defective and sends these out every time, instead of just at start
  //       if (!startTimes[dataname]) {
  //         startTimes[dataname] = timestampSecs
  //       }
  //     } else {
  //       // otherwise, observation is turning 'off' - dump the time to the current bin
  //       if (startTimes[dataname]) {
  //         const delta = timestampSecs - startTimes[dataname] // sec
  //         console.log('turning off:', dataname, 'delta:', delta)
  //         if (currentBins[bin] === undefined) {
  //           currentBins[bin] = delta
  //         } else {
  //           currentBins[bin] += delta
  //         }
  //         startTimes[dataname] = null
  //       }
  //     }
  //   }
  // }

  // could have multiple observations of the same dataitem -
  // so need to run each observation through the state machine in order.
  for (let observation of observations) {
    if (!observation.name) continue // skip observations without data names (ie agent.xml dataitems should have name attribute)

    // name might include machineId/ - remove it to get dataname, eg 'availability'
    const dataname = observation.name.slice(observation.name.indexOf('/') + 1)

    // value is eg 'Alice' for operator, 'ACTIVE' for execution, etc
    // const { timestampSecs, dayOfYear, hour, value } = observation
    const { timestampSecs, dayOfYear, hour, minute, value } = observation

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

    // check if this dataitem is a dimension we need to track, eg dataname='operator'
    if (dimensionDefs[dataname]) {
      //
      // if value of a dimension changes, dump current bins to accumulator bins
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
      //
      // otherwise, if observation is something we need to track the lifespan of,
      // update start time or current bin.
    } else if (valueDefs[dataname]) {
      const valueDef = valueDefs[dataname] // eg { bin: 'timeActive', when: 'ACTIVE' }
      const bin = valueDef.bin // eg 'timeActive'

      // handle edge transition - start or stop timetracking for the value.
      // eg valueDef.when could be 'AVAILABLE' or 'ACTIVE' etc.
      if (value === valueDef.when) {
        // start 'timer' for this observation
        // add guard in case agent is defective and sends these out every time, instead of just at start
        if (!startTimes[dataname]) {
          startTimes[dataname] = timestampSecs
        }
      } else {
        // otherwise, observation is turning 'off' - dump the time to the current bin
        if (startTimes[dataname]) {
          const delta = timestampSecs - startTimes[dataname] // sec
          console.log('turning off:', dataname, 'delta:', delta)
          if (currentBins[bin] === undefined) {
            currentBins[bin] = delta
          } else {
            currentBins[bin] += delta
          }
          startTimes[dataname] = null
        }
      }
    }
  }

  console.log('currentDimensionValues', currentDimensionValues)
  console.log('startTimes', startTimes)
  console.log('currentBins', currentBins)

  // const currentTime = new Date().getTime()
  // accumulatorBins.timeCalendar = (currentTime - previousTime) * 0.001 // sec
  // previousTime = currentTime

  //. dump accumulator bins to db
  console.log(`dump accumulator bins to db`)
  //. later write to cache, which will write to db
  // cache.set(cacheKey, { value: bins[key] }) // sec
  //. just print for now
  // eg { '{"operator":"Alice"}': { timeActive: 1 } }
  console.log('accumulatorBins', accumulatorBins)
  //. write to db
  const keys = Object.keys(accumulatorBins)
  for (let key of keys) {
    const dims = splitDimensionKey(key) // eg { operator: 'Alice' }
    const acc = accumulatorBins[key] // eg { timeActive: 1 }
    console.log('add_to', dims, 'vals', acc)
  }
  // const sql = ``
  // db.write(sql)
  console.log()
}

//

// a dimension value changed - dump current bins into accumulator bins,
// and update current dimension value
function dimensionValueChanged(
  accumulatorBins,
  currentBins,
  currentDimensionValues,
  dataname,
  value
) {
  console.log('dimensionValueChanged', dataname, value)
  // const dimensionDef = dimensionDefs[dataname]
  //
  // get key for this row, eg '{dayOfYear:298, hour:8, minute:23}'
  const dimensionKey = getDimensionKey(currentDimensionValues)
  console.log('dimensionKey', dimensionKey)
  // start new dict if needed
  if (accumulatorBins[dimensionKey] === undefined) {
    accumulatorBins[dimensionKey] = {}
  }
  // dump current bins to accumulator bins, then clear them.
  // do this so can dump all accumulator bins to db in one go, at end.
  const acc = accumulatorBins[dimensionKey] // eg { timeActive: 19.3 } // secs
  // iterate over bin keys, eg ['timeActive', ...]
  for (let binKey of Object.keys(currentBins)) {
    console.log('binkey, currentBins[binkey]', binKey, currentBins[binKey])
    if (acc[binKey] === undefined) {
      acc[binKey] = currentBins[binKey]
    } else {
      acc[binKey] += currentBins[binKey]
    }
    // clear the bin
    delete currentBins[binKey]
  }
  console.log('accbins[dimkey]', acc)
  // update current dimension value
  currentDimensionValues[dataname] = value
}

function getDimensionKey(currentDimensionValues) {
  // const dimensionKey = Object.entries(currentDimensionValues)
  //   .map(([key, value]) => `${key}=${value}`)
  //   .join(',')
  // return dimensionKey
  return JSON.stringify(currentDimensionValues)
}

function splitDimensionKey(dimensionKey) {
  // const parts = dimensionKey.split(',')
  // const pairs = parts.map(part => part.split('='))
  // return pairs
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
