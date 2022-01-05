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

  setDevices(devices) {
    console.log('setDevices', devices)
    this.devices = devices
  }

  // start the timer which dumps bins to the db by calling updateBins
  // every time interval.
  // // the caller is responsible for calling writeObservationsToBins,
  // // which will dump observations to the bins.
  //. wait, we need one to fire every minute to check for
  // relevant events, eg partcount -> device was active during that minute.
  //. also for getting state timing info - need to add dummy records every minute or whatev.
  startTimer(dbInterval) {
    console.log('startTimer')
    // this.dbTimer = setInterval(this.writeBinsToDb.bind(this), dbInterval * 1000)
    this.dbTimer = setInterval(this.updateBins.bind(this), dbInterval * 1000)
    this.dbInterval = dbInterval // save for later
  }

  // check if time is within a scheduled work period
  isTimeScheduled(datetime) {
    // const sql = `select is_time_scheduled('${device}', '${path}', '${start.toISOString()}', '${stop.toISOString()}');`
    // console.log(sql)
    // const result = await this.db.query(sql)
    // const scheduled = result.rows[0].is_time_scheduled // t/f
    // return scheduled
    return true
  }

  // update bins
  async updateBins() {
    const path = 'controller/partOccurrence/part_count-all'
    console.log('updateBins', new Date())
    // check if now is within scheduled time
    const now = new Date()
    if (this.isTimeScheduled(now)) {
      // if so, iterate over devices
      for (let device of this.devices) {
        console.log('device', device)
        const device_id = device.node_id // eg 1
        const deviceName = device.name // eg 'Cutter'
        // check for events in previous n secs
        const stop = now
        const start = new Date(stop.getTime() - this.dbInterval * 1000)
        const deviceWasActive = await this.getActive(
          deviceName,
          path,
          start,
          stop
        )
        if (deviceWasActive) {
          await this.incrementBins(device_id, now, 'active')
        }
        await this.incrementBins(device_id, now, 'available')
      }
      //. increment calendar bins - for each device?
      // await this.incrementBins(device_id, now, 'calendar')
    }
  }

  async getActive(deviceName, path, start, stop) {
    const sql = `select get_active('${deviceName}', '${path}', '${start.toISOString()}', '${stop.toISOString()}');`
    console.log(sql)
    const result = await this.db.query(sql)
    const deviceWasActive = result.rows[0].get_active // t/f
    return deviceWasActive
  }

  async incrementBins(device_id, time, field) {}
}
