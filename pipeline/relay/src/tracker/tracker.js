export class Tracker {
  // db is a Db object
  // dimensionDefs has dimensions to track, eg hours1970, operator.
  // valueDefs has values to track, including their 'on' state, eg availability.
  constructor(db, dimensionDefs, valueDefs) {
    this.db = db
    this.dimensionDefs = dimensionDefs
    this.valueDefs = valueDefs
    this.dbTimer = null
    this.observations = null
  }

  // start the timer which dumps bins to the db every minute.
  // the caller is responsible for calling writeObservationsToBins,
  // which will dump observations to the bins.
  //. wait, we also need one to fire every minute to check for
  // relevant events, eg partcount -> device was active during that minute.
  startTimer(dbInterval) {
    console.log('startTimer')
    // this.dbTimer = setInterval(this.writeBinsToDb.bind(this), dbInterval * 1000)
    this.dbTimer = setInterval(this.updateMetrics.bind(this), dbInterval * 1000)
    this.dbInterval = dbInterval // save for later
  }

  isTimeScheduled() {
    return true
  }

  updateMetrics() {
    console.log('updateMetrics', new Date())
    //. check if now is within scheduled time
    if (this.isTimeScheduled()) {
      // if so,
      //. check for events in previous n secs
      const device = 'Cutter'
      const path = 'controller/partOccurrence/part_count-all'
      // const start = '2021-12-13 03:04:00'
      // const stop = '2021-12-13 03:05:00'
      const stop = new Date()
      const start = new Date(stop.getTime() - this.dbInterval * 1000)
      const sql = `select get_active('${device}', '${path}', '${start.toISOString()}', '${stop.toISOString()}');`
      console.log(sql)
      //. check return value
      // if (ret.value > 0) {
      //. increment active bin
      // }
      //. increment available bin
    }
    //. increment calendar bin
  }
}
