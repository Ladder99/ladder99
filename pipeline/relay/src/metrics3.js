const timeout = 1000 // dump bins every minute

export class Bins {
  constructor(dimensionDefs, valueDefs) {
    this.dimensionDefs = dimensionDefs
    this.valueDefs = valueDefs
    this.timer = null
    this.bins = {}
  }

  start() {
    console.log('start')
    this.timer = setInterval(this.handler, timeout)
  }

  handleObservations(observations) {
    console.log('handleobs')
    for (let observation of observations) {
      const valueDef = this.valueDefs[observation.name]
      if (valueDef && observation.value === valueDef.when) {
        this.bins[observation.name] = new Date()
      }
    }
    console.log(this.bins)
  }

  handler() {
    console.log('handler')
    //. dump bins to db
    console.log(this.bins)
    // const sql = this.getSql()
    // this.db.write(sql)
    //. clear bins
    this.bins = {}
  }
}
