//

// dump bins to db once a minute
const timeout = 60 * 1000

//

export class Bins {
  constructor(dimensionDefs, valueDefs) {
    this.dimensionDefs = dimensionDefs
    this.valueDefs = valueDefs
    this.timer = null
    this.bins = {}
    this.startTimes = {}
    this.observations = null
  }

  // start the timer that dumps bins to the db
  startTimer() {
    console.log('startTimer')
    this.timer = setInterval(this.handleTimer, timeout)
  }

  // handle a list of observations
  // should be sorted by time first
  handleObservations(observations) {
    console.log('handleObservations')
    this.observations = observations

    // add hours1970, dimensionKey, etc to each observation
    this.amendObservations()

    for (let observation of observations) {
      const valueDef = this.valueDefs[observation.name]
      const timerKey = observation.device_id + '-' + observation.name
      const binKey = 'po'

      // check if this is a value we're tracking, eg availability, execution_state
      if (valueDef) {
        this.handleValue(observation, valueDef, timerKey, binKey)
        //
      } else {
        // check if it's a dimension we're tracking - eg hours1970, operator
        const dimensionDef = this.dimensionDefs[observation.name]
        if (dimensionDef) {
          this.handleDimension(observation, dimensionDef)
        }
      }
    }
    console.log(this.bins)
  }

  // if value changed to 'on' state, eg 'ACTIVE', 'AVAILABLE',
  // start a clock to track time in that state.
  // otherwise add the time delta to a bin, clear the clock.
  handleValue(observation, valueDef, timerKey, binKey) {
    if (observation.value === valueDef.when) {
      if (this.startTimes[timerKey] === undefined) {
        this.startTimes[timerKey] = observation.seconds1970
      }
    } else {
      const delta = observation.seconds1970 - this.startTimes[timerKey]
      if (this.bins[binKey] === undefined) {
        this.bins[binKey] = delta // create new bin with delta
      } else {
        this.bins[binKey] += delta // add delta to existing bin
      }
      delete this.startTimes[timerKey]
    }
  }

  //. dump current bins to the accumulator bins, reset all startTimes?
  handleDimension(observation, dimensionDef) {
    const { dimensionKey } = observation
  }

  handleTimer() {
    console.log('handleTimer - dump any bin adjustments to db')
    //. including time_calendar
    //. dump bins to db
    console.log(this.bins)
    // const sql = this.getSql()
    // this.db.write(sql)
    //. clear bins
    this.bins = {}
  }

  // add info to observations, incl time as hours1970.
  amendObservations() {
    for (let observation of this.observations) {
      if (!observation.name) continue // skip uninteresting ones

      const date = new Date(observation.timestamp)

      // convert iso timestamps to seconds since 1970-01-01
      //. where used?
      observation.timestampSecs = date.getTime() * 0.001 // seconds

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

const secondsPerDay = 24 * 60 * 60
const secondsPerHour = 60 * 60
const secondsPerMillisecond = 0.001
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

// get hours since 1970-01-01
export function getHours1970(date) {
  return 1234567 //.
  // const year = date.getYear()
  // const base = new Date(year, 0, 1).getTime() * 0.001
  // const seconds =
  //   base + (dims.dayOfYear - 1) * secondsPerDay + dims.hour * secondsPerHour
}

function getSeconds1970(date) {
  return date.getTime() * secondsPerMillisecond // seconds
}
