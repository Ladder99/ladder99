const timeout = 1000 // dump bins every minute

export class Bins {
  constructor(dimensionDefs, valueDefs) {
    this.dimensionDefs = dimensionDefs
    this.valueDefs = valueDefs
    this.timer = null
    this.bins = {}
    this.startTimes = {}
  }

  startTimer() {
    console.log('startTimer')
    this.timer = setInterval(this.handleTimer, timeout)
  }

  handleObservations(observations) {
    console.log('handleobs')
    for (let observation of observations) {
      const valueDef = this.valueDefs[observation.name]
      const dimensionDef = this.dimensionDefs[observation.name]
      // check if this is a value we're tracking
      if (valueDef) {
        const startTime = this.startTimes[observation.name]
        if (observation.value === valueDef.when) {
          if (this.startTimes[observation.name] === undefined) {
            this.startTimes[observation.name] = new Date().getTime()
          }
        } else {
          if (this.bins[observation.name]) {
            this.bins[observation.name] =
              new Date().getTime() - this.startTimes[observation.name]
          } else {
          }
        }
        //
        // else check if it's a dimension we need to track
      } else if (dimensionDef) {
        // check that dimension key has changed -
        // if so, dump the current bins to the accumulator bins, stop the clocks ?
        const { dimensionKey } = observation
      }
    }
    console.log(this.bins)
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
}
