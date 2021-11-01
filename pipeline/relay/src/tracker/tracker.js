// Track changes to dimensions and values as observations come in,
// write them to bins. Timer writes bins to database once a minute.

import * as time from './time.js'
import * as clock from './clock.js'
import * as bins from './bins.js'

// dump bins to db once a minute
const defaultDbInterval = 60 // in sec

export class Tracker {
  // db is a Db object
  // dimensionDefs has dimensions to track, eg hours1970, operator.
  // valueDefs has values to track, including their 'on' state, eg availability.
  constructor(db, dimensionDefs, valueDefs) {
    this.db = db
    this.dimensionDefs = dimensionDefs
    this.valueDefs = valueDefs
    this.bins = new bins.Bins()
    this.clock = new clock.Clock()
    this.dbTimer = null
    this.observations = null
  }

  // start the timer which dumps bins to the db every minute.
  // the caller is responsible for calling writeObservationsToBins,
  // which will dump observations to the bins.
  startTimer(dbInterval = defaultDbInterval) {
    this.dbTimer = setInterval(this.writeBinsToDb.bind(this), dbInterval * 1000)
    this.dbInterval = dbInterval // save for later
  }

  // update bins given a list of observations.
  // observations should be sorted by time!
  writeObservationsToBins(observations) {
    this.observations = observations

    // add hours1970 etc to each observation
    this.amendObservations()

    // check for dimension or value changes
    for (let observation of observations) {
      // set dimensionkey hours1970 here
      //. ok?
      this.bins.setDimensionValue(
        observation.device_id,
        'hours1970',
        observation.hours1970
      )

      // check if it's a dimension we're tracking - eg hours1970, operator
      const dimensionDef = this.dimensionDefs[observation.name]
      if (dimensionDef) {
        // if we're tracking this dimension, update key and reset clocks
        this.trackDimensionChange(observation, dimensionDef)
      } else {
        //
        // else check if it's a value we're tracking, eg availability, execution_state
        const valueDef = this.valueDefs[observation.name]
        if (valueDef) {
          // if we're tracking this value, update clock and add to bin
          this.trackValueChange(observation, valueDef)
        }
      }
    }
  } // end of writeObservationsToBins

  // a dimension value changed - update dimensionkey and reset all clocks
  trackDimensionChange(observation, dimensionDef) {
    // console.log('track dimension change')
    // update the bins dimensionkey
    const { device_id, name, value } = observation
    this.bins.setDimensionValue(device_id, name, value)
    // restart all clocks for this device
    this.clock.restartAll(observation)
  }

  // value changed - update clock, add to bins as needed
  trackValueChange(observation, valueDef) {
    // if value changed to 'on' state, eg 'ACTIVE', 'AVAILABLE',
    // start a clock to track time in that state.
    if (observation.value === valueDef.when) {
      this.clock.start(observation)
    } else {
      // otherwise add the time delta to a bin, clear the clock.
      const delta = this.clock.stop(observation)
      if (delta > 0) {
        this.bins.addObservation(observation, delta)
      }
      this.clock.clear(observation)
    }
  }

  // write all bin deltas to the database.
  //. want this to write to db every hour, even if no deltas - how?
  writeBinsToDb() {
    console.log('writeBinsToDb')
    console.log('bins.data', this.bins.data)
    // console.log('bins.dimensionKeys', this.bins.dimensionKeys)

    let sql = ''

    const device_ids = Object.keys(this.bins.data)
    for (let device_id of device_ids) {
      //
      // update calendar time
      const observation = { device_id, slot: 'time_calendar' }
      this.bins.addObservation(observation, this.dbInterval)

      // get sql for updates
      sql += this.bins.getSql(device_id)

      // clear bins
      this.bins.clearDeviceData(device_id)
    }
    // write to db
    if (sql !== '') {
      console.log(sql)
      this.db.query(sql)
    }
  }

  // add info to observations, incl time as hours1970.
  amendObservations() {
    for (let observation of this.observations) {
      if (!observation.name) continue // skip uninteresting ones

      const valueDef = this.valueDefs[observation.name] //. will be type-subtype etc?
      observation.slot = valueDef && valueDef.slot // eg 'time_available'

      const date = new Date(observation.timestamp)
      observation.hours1970 = time.getHours1970(date) // hours since 1970-01-01
      observation.seconds1970 = date.getTime() * 0.001 // seconds since 1970-01-01
    }
  }
}
