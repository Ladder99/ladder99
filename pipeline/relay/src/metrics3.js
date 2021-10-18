// track changes to dimensions and values as observations come in,
// dump changes to database once a minute.

import * as time from './time.js'

// dump bins to db once a minute
const defaultDbInterval = 60 * 1000 // in msec

//

export class Tracker {
  // db is a Db object
  //. dimensionDefs is {}
  //. valueDefs is {}
  constructor(db, dimensionDefs, valueDefs) {
    this.db = db
    this.dimensionDefs = dimensionDefs
    this.valueDefs = valueDefs
    this.bins = new Bins()
    this.clock = new Clock()
    this.dbTimer = null
    this.observations = null
  }

  // start the timer that dumps bins to the db
  startTimer(dbInterval = defaultDbInterval) {
    console.log('startTimer')
    this.dbTimer = setInterval(this.writeToDb.bind(this), dbInterval)
  }

  // update bins given a list of observations.
  // observations should be sorted by time.
  trackObservations(observations) {
    console.log('trackObservations')
    this.observations = observations

    // add hours1970, dimensionKey, etc to each observation
    this.amendObservations()

    for (let observation of observations) {
      // check if this is a value we're tracking, eg availability, execution_state
      const valueDef = this.valueDefs[observation.name]
      if (valueDef) {
        this.trackValueChange(observation, valueDef)
        //
      } else {
        // check if it's a dimension we're tracking - eg hours1970, operator
        const dimensionDef = this.dimensionDefs[observation.name]
        if (dimensionDef) {
          this.trackDimensionChange(observation, dimensionDef)
        }
      }
    }
  }

  // value changed - update clock, add to bins as needed
  trackValueChange(observation, valueDef) {
    // if value changed to 'on' state, eg 'ACTIVE', 'AVAILABLE',
    // start a clock to track time in that state.
    if (observation.value === valueDef.when) {
      this.clock.start(observation)
    } else {
      // otherwise add the time delta to a bin, clear the clock.
      const seconds = this.clock.stop(observation)
      if (seconds > 0) {
        this.bins.add(observation, seconds)
      }
      this.clock.clear(observation)
    }
  }

  // dimension changed - dump all bins to accumulators, reset all clocks
  //?
  trackDimensionChange(observation, dimensionDef) {
    const { dimensionKey } = observation
    this.bins.setDimensionKey(dimensionKey)
    this.clock.clear(observation)
    this.clock.start(observation)
  }

  // write all bin deltas to the database
  //. include time_calendar also
  writeToDb() {
    console.log('writeToDb')
    console.log(this.bins)
    // get sql for updates and clear bins
    const sql = this.bins.getSql()
    this.bins.clear()
    // write to db
    console.log(sql)
    // this.db.write(sql) //.
  }

  // add info to observations, incl time as hours1970.
  amendObservations() {
    for (let observation of this.observations) {
      if (!observation.name) continue // skip uninteresting ones

      observation.key = observation.device_id + '-' + observation.name

      const date = new Date(observation.timestamp)

      // convert iso timestamps to seconds since 1970-01-01
      observation.seconds1970 = date.getTime() * 0.001 // in seconds

      // round down to hour
      observation.hours1970 = time.getHours1970(date) // hours since 1970-01-01

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
//. what if dimensionKey is incomplete?
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

//

class Clock {
  constructor(tracker) {
    // this.tracker = tracker
    this.startTimes = {}
  }

  // start clock for the given observation
  start(observation) {
    const { key } = observation
    // add guard in case agent sends same value again
    if (this.startTimes[key] === undefined) {
      this.startTimes[key] = observation.seconds1970
    }
  }

  // stop clock for given observation, return time delta in seconds
  stop(observation) {
    const { key } = observation
    let seconds
    if (this.startTimes[key] !== undefined) {
      seconds = observation.seconds1970 - this.startTimes[key]
      // clear the clock
      delete this.startTimes[key]
    }
    return seconds
  }

  clear(observation) {
    delete this.startTimes[observation.key]
  }
}

//

class Bins {
  constructor() {
    this.bins = {}
  }
  add(observation, seconds) {
    const { key } = observation
    if (this.bins[key] === undefined) {
      this.bins[key] = seconds // create new bin with seconds
    } else {
      this.bins[key] += seconds // add seconds to existing bin
    }
  }
  clear() {
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
}
