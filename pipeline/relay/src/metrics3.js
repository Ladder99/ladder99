// track changes to dimensions and values as observations come in,
// dump changes to database once a minute.

// constants
const secondsPerDay = 24 * 60 * 60
const secondsPerHour = 60 * 60
const millisecondsPerSecond = 1000
const secondsPerMillisecond = 0.001
const daysPerMillisecond = 1 / (secondsPerDay * 1000)
const hoursPerSecond = 1 / 3600

// dump bins to db once a minute
const writeToDbTimeout = 60 * millisecondsPerSecond

//

export class Tracker {
  constructor(dimensionDefs, valueDefs) {
    this.dimensionDefs = dimensionDefs
    this.valueDefs = valueDefs
    this.timer = null
    this.bins = {}
    this.startTimes = {}
    this.observations = null
  }

  // start the timer that dumps bins to the db
  startTimer(writeToDbTimeout = 60 * 1000) {
    console.log('startTimer', writeToDbTimeout)
    this.timer = setInterval(this.writeToDb.bind(this), writeToDbTimeout)
  }

  // update bins given a list of observations.
  // observations should be sorted by time.
  updateBins(observations) {
    console.log('updateBins')
    this.observations = observations

    // add hours1970, dimensionKey, etc to each observation
    this.amendObservations()

    for (let observation of observations) {
      const key = observation.device_id + '-' + observation.name

      // check if this is a value we're tracking, eg availability, execution_state
      const valueDef = this.valueDefs[observation.name]
      if (valueDef) {
        this.trackValue(observation, valueDef, key)
        //
      } else {
        // check if it's a dimension we're tracking - eg hours1970, operator
        const dimensionDef = this.dimensionDefs[observation.name]
        if (dimensionDef) {
          this.trackDimension(observation, dimensionDef)
        }
      }
    }
  }

  // if value changed to 'on' state, eg 'ACTIVE', 'AVAILABLE',
  // start a clock to track time in that state.
  // otherwise add the time delta to a bin, clear the clock.
  trackValue(observation, valueDef, key) {
    if (observation.value === valueDef.when) {
      if (this.startTimes[key] === undefined) {
        this.startTimes[key] = observation.seconds1970
      }
    } else {
      if (this.startTimes[key] !== undefined) {
        const delta = observation.seconds1970 - this.startTimes[key]
        if (this.bins[key] === undefined) {
          this.bins[key] = delta // create new bin with delta
        } else {
          this.bins[key] += delta // add delta to existing bin
        }
        delete this.startTimes[key]
      }
    }
  }

  // dimension value changed
  //. dump all bins to db, reset all startTimes?
  trackDimension(observation, dimensionDef) {
    const { dimensionKey } = observation
  }

  writeToDb() {
    console.log('writeToDb - dump any bin adjustments to db')
    //. do time_calendar also
    //. dump bins to db
    console.log('bins', this.bins)
    const sql = this.getSql()
    console.log(sql)
    // this.db.write(sql)
    // clear bins
    this.bins = {}
  }

  // get sql statements to write given accumulator bin data to db.
  // accumulatorBins is like { device_id: bins }
  //   with bins like { dimensions: accumulators }
  //   dimensions are like "{operator:'Alice'}"
  //   with accumulators like { time_active: 1, time_available: 2 }}
  // getSql(accumulatorBins) {
  getSql() {
    let sql = ''
    //     //
    //     // iterate over device+bins
    //     // device_id is a db node_id, eg 3
    //     // bins is a dict like { dimensions: accumulators }
    //     for (let [device_id, bins] of Object.entries(accumulatorBins)) {
    //       //
    //       // iterate over dimensions+accumulators
    //       // dimensions is eg '{"operator":"Alice", ...}' - ie gloms dimensions+values together
    //       // accumulators is eg { time_active: 1, time_available: 2, ... },
    //       //   ie all the accumulator slots and their time values in seconds.
    //       for (let [dimensions, accumulators] of Object.entries(bins)) {
    //         //
    //         const accumulatorSlots = Object.keys(accumulators) // eg ['time_active', 'time_available']
    //         if (accumulatorSlots.length === 0) continue // skip if no data

    //         // split dimensions into dimensions+values and get associated time.
    //         const dims = splitDimensionKey(dimensions) // eg to {operator: 'Alice'}
    //         const seconds1970 = getHourInSeconds(dims) // rounded to hour, in seconds
    //         if (!seconds1970) continue // skip if got NaN or something
    //         const timestring = new Date(
    //           seconds1970 * millisecondsPerSecond
    //         ).toISOString() // eg '2021-10-15T11:00:00Z"

    //         // iterate over accumulator slots, eg 'time_active', 'time_available'.
    //         for (let accumulatorSlot of accumulatorSlots) {
    //           // get total time accumulated for the slot
    //           const timeDelta = accumulators[accumulatorSlot]
    //           if (timeDelta > 0) {
    //             // add values one at a time to existing db records.
    //             // would be better to do all with one stmt somehow,
    //             // but it's already complex enough.
    //             // this is an upsert command pattern in postgres -
    //             // try to add a new record - if key is already there,
    //             // update existing record by adding timeDelta to the value.
    //             sql += `
    // INSERT INTO bins (device_id, time, dimensions, values)
    //   VALUES (${device_id}, '${timestring}',
    //     '${dimensions}'::jsonb,
    //     '{"${accumulatorSlot}":${timeDelta}}'::jsonb)
    // ON CONFLICT (device_id, time, dimensions) DO
    //   UPDATE SET
    //     values = bins.values ||
    //       jsonb_build_object('${accumulatorSlot}',
    //         (coalesce((bins.values->>'${accumulatorSlot}')::real, 0.0::real) + ${timeDelta}));
    //   `
    //           }
    //         }
    //       }
    //     }
    return sql
  }

  // add info to observations, incl time as hours1970.
  amendObservations() {
    for (let observation of this.observations) {
      if (!observation.name) continue // skip uninteresting ones

      const date = new Date(observation.timestamp)

      // convert iso timestamps to seconds since 1970-01-01
      observation.seconds1970 = date.getTime() * secondsPerMillisecond

      // round down to hour
      observation.hours1970 = getHours1970(date) // hours since 1970-01-01

      // assign dimension key to observation
      observation.dimensionKey = getDimensionKey(
        observation,
        this.dimensionDefs
      )
    }
  }
}

//

// get dimension key for an observation,
// eg '{"hour1970":1234567,"operator":"Alice"}'
export function getDimensionKey(observation, dimensionDefs) {
  const dimensions = {}
  for (let dimension of Object.keys(dimensionDefs)) {
    dimensions[dimension] = observation[dimension]
  }
  return JSON.stringify(dimensions)
}
export function splitDimensionKey(dimensionKey) {
  return JSON.parse(dimensionKey)
}

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

// // get hour given year, dayOfYear, hour, and minute - in seconds since 1970
// // export function getHourInSeconds(dims) {
// //   const base = new Date(dims.year, 0, 1).getTime() * 0.001
// //   const seconds =
// //     base +
// //     (dims.dayOfYear - 1) * secondsPerDay +
// //     dims.hour * secondsPerHour +
// //     dims.minute * secondsPerMinute
// //   return seconds
// // }
// export function getHourInSeconds(dims) {
//   const base = new Date(dims.year, 0, 1).getTime() * 0.001
//   const seconds =
//     base + (dims.dayOfYear - 1) * secondsPerDay + dims.hour * secondsPerHour
//   return seconds
// }

// get hours since 1970-01-01
export function getHours1970(date) {
  const date2 = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    date.getHours()
  )
  return date2.getTime() * secondsPerMillisecond * hoursPerSecond
}

function getSeconds1970(date) {
  return date.getTime() * secondsPerMillisecond // seconds
}
