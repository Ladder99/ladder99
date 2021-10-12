// see dataObservations - bring over here

//. move these into yaml, and have per client

// dimensionDefs
// if any one of these changes, start putting the time/count values in other bins.
// keyed on dataitem/observation name.
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
// as set in the migrations/*.sql files.
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
export function getMetrics(currentDimensionValues, startTimes, observations) {
  // get hour, minute, etc for each observation
  assignTimesToObservations(observations)

  // get bins
  const accumulatorBins = getAccumulatorBins(
    observations,
    currentDimensionValues,
    startTimes
  )

  // return accumulator bins - will convert to sql and write to db
  return accumulatorBins
}

function getAccumulatorBins(observations, currentDimensionValues, startTimes) {
  // accumulated bins for this calculation run - will return at end.
  // this is a dict of dicts - keyed on dimensions (glommed together as json),
  // then bin name.
  // eg { '{"dayOfYear":284,"hour":2,"minute":29}': { time_active: 32 } }
  const accumulatorBins = {}

  // bins for the current set of dimension values.
  // added to accumulator and cleared on each change of a dimension value.
  // keyed on bin name.
  // will be like { time_active: 8.1 } // seconds
  const currentBins = {}

  // run each observation through handler in order
  //. get currentBins, accumulatorBins? call it getBins?
  // console.log('iterate over observations, handle each in order')
  for (let observation of observations) {
    if (!observation.name) continue // skip observations without data names (ie agent.xml dataitems should have name attribute)
    handleObservation(
      observation,
      currentDimensionValues,
      accumulatorBins,
      currentBins,
      startTimes
    )
    // console.log()
  }

  // console.log('currentDimensionValues', currentDimensionValues)
  // console.log('accumulatorBins', accumulatorBins)
  // console.log('currentBins', currentBins)
  // console.log('startTimes', startTimes)
  // console.log()

  //. dump current bins into currentDimensionValues?

  //. update calendartime
  // const currentTime = new Date().getTime()
  // accumulatorBins.calendarTime = (currentTime - previousTime) * 0.001 // sec
  // previousTime = currentTime

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

function foo(pok) {}

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
// exported for testing.
export function handleObservation(
  observation,
  currentDimensionValues,
  accumulatorBins,
  currentBins,
  startTimes
) {
  // name might include machineId/ - remove it to get dataname, eg 'availability'
  const dataname = observation.name.slice(observation.name.indexOf('/') + 1)

  // value is eg 'Alice' for operator, 'ACTIVE' for execution, etc
  // const { timestampSecs, dayOfYear, hour, value } = observation
  const { timestampSecs, year, dayOfYear, hour, minute, value } = observation

  // console.log(`handle observation`, observation)

  // if observation is something we're tracking the state of,
  // update start time or current bin.
  if (valueDefs[dataname]) {
    // console.log(`got an observation for`, dataname)
    const valueDef = valueDefs[dataname] // eg { bin: 'time_active', when: 'ACTIVE' }
    const bin = valueDef.bin // eg 'time_active'

    // handle edge transition - start or stop timetracking for the value.
    // eg valueDef.when could be 'AVAILABLE' or 'ACTIVE' etc.
    if (value === valueDef.when) {
      // start 'timer' for this observation
      // add guard in case agent is defective and sends these out every time, instead of just at start
      if (!startTimes[dataname]) {
        // console.log(`start timer for`, dataname)
        startTimes[dataname] = timestampSecs
      }
    } else {
      // otherwise, observation is turning 'off' - dump the time to the current bin
      if (startTimes[dataname]) {
        const delta = timestampSecs - startTimes[dataname] // sec
        // console.log('turning off:', dataname, 'delta:', delta)
        if (currentBins[bin] === undefined) {
          currentBins[bin] = delta
        } else {
          currentBins[bin] += delta
        }
        startTimes[dataname] = null
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
  }

  dimensionValueChanged(accumulatorBins, currentBins, currentDimensionValues)
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
  // console.log('dimensionValueChanged', dataname, value, currentBins)
  // const dimensionDef = dimensionDefs[dataname]
  //
  // get key for this row, eg '{dayOfYear:298, hour:8, minute:23}'
  const dimensionKey = getDimensionKey(currentDimensionValues)
  // console.log('dimensionKey', dimensionKey)
  // start new dict if needed
  if (accumulatorBins[dimensionKey] === undefined) {
    accumulatorBins[dimensionKey] = {}
  }
  // dump current bins to accumulator bins, then clear them.
  // do this so can dump all accumulator bins to db in one go, at end.
  const acc = accumulatorBins[dimensionKey] // eg { time_active: 19.3 } // secs
  // iterate over bin keys, eg ['time_active', ...]
  for (let binKey of Object.keys(currentBins)) {
    // console.log('binkey, currentBins[binkey]', binKey, currentBins[binKey])
    if (acc[binKey] === undefined) {
      acc[binKey] = currentBins[binKey]
    } else {
      acc[binKey] += currentBins[binKey]
    }
    // clear the bin
    // console.log(`clear current bin`, binKey)
    delete currentBins[binKey]
  }
  // console.log('accbins[dimkey]', acc)

  // update current dimension value
  // console.log(`update current dim value`, dataname, value)
  currentDimensionValues[dataname] = value
}

export function getSql(accumulatorBins) {
  console.log('getsql', accumulatorBins)
  const keys = Object.keys(accumulatorBins)
  let sql = ''
  for (let key of keys) {
    const acc = accumulatorBins[key] // eg { time_active: 1 }
    if (Object.keys(acc).length === 0) continue

    // split key into dimensions+values
    const dims = splitDimensionKey(key) // eg { operator: 'Alice' }
    console.log(dims)

    const seconds1970 = getHourInSeconds(dims)
    console.log(seconds1970)
    if (seconds1970) {
      // console.log(seconds1970)
      const time = new Date(seconds1970 * 1000).toISOString()
      // get bin for this key
      const valueKeys = Object.keys(acc)
      if (valueKeys.length > 0 && acc.time_available) {
        sql += `INSERT INTO bins (time, dimensions, time_available) `
        for (let valueKey of valueKeys) {
          const delta = acc[valueKey]
        }
        sql += `VALUES ('${device_id}, ${time}', '${key}'::jsonb, ${acc.time_available}) `
        sql += `ON CONFLICT (time, dimensions) DO `
        sql += `UPDATE SET time_available = EXCLUDED.time_available + bins.time_available;`
      }
    }
  }
  return sql
}

const secondsPerYear = 365.25 * 24 * 60 * 60
const secondsPerDay = 24 * 60 * 60
const secondsPerHour = 60 * 60
const secondsPerMinute = 60

function getHourInSeconds(dims) {
  // console.log(dims)
  const seconds =
    (dims.year - 1970) * secondsPerYear +
    (dims.dayOfYear - 1) * secondsPerDay +
    dims.hour * secondsPerHour +
    dims.minute * secondsPerMinute
  // const d = new Date(dims.year, dims.month, dims.date, dims.hours, dims.minutes)
  // const e = new Date()
  return seconds
}
