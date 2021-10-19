// track changes to dimensions and values as observations come in,
// dump changes to database once a minute.

import * as time from './time.js'
import * as clock from './clock.js'

// dump bins to db once a minute
const defaultDbInterval = 60 // in sec

export class Tracker {
  // db is a Db object
  // dimensionDefs is set of dimensions to track, eg operator
  // valueDefs is set of values to track, including their 'on' state, eg availability
  constructor(db, dimensionDefs, valueDefs) {
    this.db = db
    this.dimensionDefs = dimensionDefs
    this.valueDefs = valueDefs
    this.bins = new Bins()
    this.clock = new clock.Clock()
    this.dbTimer = null
    this.observations = null
  }

  // start the timer that dumps bins to the db every minute
  startTimer(dbInterval = defaultDbInterval) {
    console.log('startTimer')
    this.dbTimer = setInterval(this.writeToDb.bind(this), dbInterval * 1000)
    this.dbInterval = dbInterval // save for later
  }

  // update bins given a list of observations.
  // observations should be sorted by time.
  trackObservations(observations) {
    console.log('trackObservations')
    this.observations = observations

    // add hours1970, dimensionKey, etc to each observation
    this.amendObservations()

    for (let observation of observations) {
      // check if it's a dimension we're tracking - eg hours1970, operator
      const dimensionDef = this.dimensionDefs[observation.name]
      if (dimensionDef) {
        this.trackDimensionChange(observation, dimensionDef)
      } else {
        // check if this is a value we're tracking, eg availability, execution_state
        const valueDef = this.valueDefs[observation.name]
        if (valueDef) {
          this.trackValueChange(observation, valueDef)
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
        this.bins.addObservation(observation, seconds)
      }
      this.clock.clear(observation)
    }
  }

  // a dimension value changed - dump all bins to accumulators, reset all clocks?
  //. so dump accums to db, not bins? mebbe eventually
  trackDimensionChange(observation, dimensionDef) {
    this.bins.setDimensionValue(
      observation.device_id,
      observation.name,
      observation.value
    )
    this.clock.clear(observation)
    this.clock.start(observation)
  }

  // write all bin deltas to the database
  //. include time_calendar also
  writeToDb() {
    console.log('writeToDb')
    console.log('bins.data', this.bins.data)
    const device_ids = Object.keys(this.bins.data)
    // const device_ids = this.bins.getDeviceIds()
    let sql = ''

    for (let device_id of device_ids) {
      // update calendar time
      const observation = { device_id, slot: 'time_calendar' }
      this.bins.addObservation(observation, this.dbInterval)

      // get sql for updates
      sql += this.bins.getSql(device_id)

      // clear bins
      this.bins.clearDeviceData(device_id)
    }
    // write to db
    // this.db.write(sql) //.
    console.log(sql) //.
  }

  // add info to observations, incl time as hours1970.
  amendObservations() {
    for (let observation of this.observations) {
      if (!observation.name) continue // skip uninteresting ones

      const valueDef = this.valueDefs[observation.name]
      // const dimensionDef = this.dimensionDefs[observation.name]

      if (!valueDef) continue // skip obs if not tracking its value

      observation.slot = valueDef.slot // eg 'time_available'

      const date = new Date(observation.timestamp)
      observation.seconds1970 = date.getTime() * 0.001 // seconds since 1970-01-01
      observation.hours1970 = time.getHours1970(date) // hours since 1970-01-01
    }
  }
}

//

//

export class Bins {
  constructor() {
    this.data = {}
    this.dimensionKeys = {} // per device_id
  }
  // add an observation amount to a slot
  addObservation(observation, delta) {
    // note: already looked up slot in amendObservations
    const { device_id, slot } = observation
    const dimensionKey = this.getDimensionKey(device_id)
    const existingValue = this._getSlot(device_id, dimensionKey, slot)
    if (existingValue === undefined) {
      // create new bin with delta
      this._setSlot(device_id, dimensionKey, slot, delta)
    } else {
      // add delta to existing bin
      this._setSlot(device_id, dimensionKey, slot, existingValue + delta)
    }
  }
  // neither object or Map let you use an object/array as key where
  // you can retrieve a value with another object/array constructed similarly -
  // it must be the exact same object/array. so do this...
  _getSlot(key1, key2, key3) {
    const value1 = this.data[key1]
    if (value1 !== undefined) {
      const value2 = value1[key2]
      if (value2 !== undefined) {
        return value2[key3]
      }
    }
  }
  _setSlot(key1, key2, key3, value) {
    const value1 = this.data[key1]
    if (value1 !== undefined) {
      const value2 = value1[key2]
      if (value2 !== undefined) {
        value2[key3] = value
      } else {
        value1[key2] = { [key3]: value }
      }
    } else {
      this.data[key1] = { [key2]: { [key3]: value } }
    }
  }

  // clear data for one device
  clearDeviceData(device_id) {
    delete this.data[device_id]
  }

  // set one axis of the dimension key for a particular device
  setDimensionValue(device_id, key, value) {
    const keyvalues = this.dimensionKeys[device_id]
    if (keyvalues !== undefined) {
      keyvalues[key] = value
    } else {
      this.dimensionKeys[device_id] = { [key]: value }
    }
  }
  // get the dimension key for a device, eg '{"operator":"alice"}'
  getDimensionKey(device_id) {
    return JSON.stringify(this.dimensionKeys[device_id] || {})
  }

  // get sql statements to write given device_id data to db.
  // this.data is like { device_id: bins }
  //   with bins like { dimensions: accumulators }
  //   dimensions are like '{"operator":"Alice"}'
  //   with accumulators like { time_active: 1, time_available: 2 }}
  // getSql(accumulatorBins) {
  getSql(device_id) {
    let sql = ''
    // sql += JSON.stringify(this.data[device_id])
    //
    // bins is a dict like { dimensions: accumulators }
    // for (let [device_id, bins] of Object.entries(accumulatorBins)) {
    const bins = this.data[device_id]
    //
    // iterate over dimensions+accumulators
    // dimensions is eg '{"operator":"Alice", ...}' - ie gloms dimensions+values together
    // accumulators is eg { time_active: 1, time_available: 2, ... },
    //   ie all the accumulator slots and their time values in seconds.
    for (let [dimensions, accumulators] of Object.entries(bins)) {
      //
      const accumulatorSlots = Object.keys(accumulators) // eg ['time_active', 'time_available']
      if (accumulatorSlots.length === 0) continue // skip if no data

      // split dimensions into dimensions+values and get associated time.
      // const dims = splitDimensionKey(dimensions) // eg to {operator: 'Alice'}
      const dims = JSON.parse(dimensions) // eg to {operator: 'Alice'}
      // const seconds1970 = getHourInSeconds(dims) // rounded to hour, in seconds
      // if (!seconds1970) continue // skip if got NaN or something
      const seconds1970 = 12345678 //..
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
    return sql
  }
}
