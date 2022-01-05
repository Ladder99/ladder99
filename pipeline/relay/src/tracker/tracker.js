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
    // this.dbTimer = setInterval(this.writeBinsToDb.bind(this), dbInterval * 1000)
    // this.dbInterval = dbInterval // save for later
    console.log('hi')
    this.dbTimer = setInterval(this.foo.bind(this), dbInterval * 1000)
  }

  foo() {
    console.log('foo', new Date())
  }
}
