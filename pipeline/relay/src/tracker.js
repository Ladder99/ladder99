// Track events every n seconds and increment bins as needed.

//. what if had one tracker per device? might need that.

//. pass in through constructor, with devices and metrics to track.
//. which should come from a client yaml file. metrics.yaml?
const path = 'controller/partOccurrence/part_count-all'

export class Tracker {
  // db is a Db object, setup is the client setup.yaml contents
  constructor(db, setup) {
    this.db = db
    this.setup = setup
    this.dbTimer = null
    this.devices = []
  }

  setDevices(devices) {
    console.log('setDevices', devices)
    this.devices = devices
    this.deviceIds = {}
    for (let device of devices) {
      this.deviceIds[device.name] = device.node_id
    }
    console.log('deviceIds', this.deviceIds)
  }

  // start the timer which calls updateBins every n seconds -
  // it will increment bins as needed.
  // eg a partcount event indicates device was active during that minute.
  startTimer(dbInterval) {
    console.log('startTimer')
    this.dbTimer = setInterval(this.updateBins.bind(this), dbInterval * 1000)
    this.dbInterval = dbInterval // save for later
  }

  //. query db for start and stop dataitems for given device
  //. just use the regular device name, eg 'Marumatsu'
  async getSchedule(device) {
    const start = await this.db.getLatestValue(
      'history_text',
      device,
      'processes/process_time-start'
    )
    const stop = await this.db.getLatestValue(
      'history_text',
      device,
      'processes/process_time-stop'
    )
    const schedule = { start, stop }
    console.log('schedule', schedule)
    return schedule
  }

  // check if time is within a scheduled work period
  async isTimeScheduled(datetime, schedule) {
    //. todo
    // const sql = `select is_time_scheduled('${deviceName}', '${path}', '${start.toISOString()}', '${stop.toISOString()}');`
    // console.log(sql)
    // const result = await this.db.query(sql)
    // const scheduled = result.rows[0].is_time_scheduled // t/f
    const scheduled = true
    return scheduled
  }

  // update bins - called by timer
  async updateBins() {
    console.log('updateBins', new Date())
    const now = new Date()
    // iterate over devices
    // for (let device of this.devices) {
    for (let device of this.setup.devices) {
      // we only want to track devices with a metrics object
      if (device.metrics) {
        // get schedule for this device
        const schedule = await this.getSchedule(device)
        // check if now is within scheduled time
        const scheduled = await this.isTimeScheduled(now, schedule)
        if (scheduled) {
          console.log('device', device)
          const deviceName = device.name // eg 'Cutter'
          const device_id = this.deviceIds[deviceName] // eg 1
          // check for events in previous n secs
          const stop = now
          const start = new Date(stop.getTime() - this.dbInterval * 1000)
          const deviceWasActive = await this.getActive(
            device,
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
  }

  // check if a device was 'active' (ie has events on the given path),
  // between two times. returns true/false
  async getActive(device, path, start, stop) {
    const sql = `select get_active('${
      device.name
    }', '${path}', '${start.toISOString()}', '${stop.toISOString()}');`
    console.log(sql)
    const result = await this.db.query(sql)
    const deviceWasActive = result.rows[0].get_active // t/f
    return deviceWasActive
  }

  // increment values in the bins table.
  // will round the given time down to nearest min, hour, day, week etc,
  // and increment the given field for each.
  //. move plpgsql code into here - easier to maintain
  async incrementBins(device_id, time, field) {
    const sql = `call increment_bins(${device_id}, '${time.toISOString()}', '${field}');`
    console.log(sql)
    await this.db.query(sql)
  }
}
