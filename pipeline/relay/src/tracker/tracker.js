// Track events every n seconds and increment bins as needed.

const path = 'controller/partOccurrence/part_count-all'

export class Tracker {
  // db is a Db object
  constructor(db) {
    this.db = db
    this.dbTimer = null
    this.devices = []
  }

  setDevices(devices) {
    console.log('setDevices', devices)
    this.devices = devices
  }

  // start the timer which calls updateBins every n seconds -
  // it will increment bins as needed.
  // eg partcount event indicates device was active during that minute.
  startTimer(dbInterval) {
    console.log('startTimer')
    this.dbTimer = setInterval(this.updateBins.bind(this), dbInterval * 1000)
    this.dbInterval = dbInterval // save for later
  }

  // check if time is within a scheduled work period
  async isTimeScheduled(datetime) {
    // const sql = `select is_time_scheduled('${deviceName}', '${path}', '${start.toISOString()}', '${stop.toISOString()}');`
    // console.log(sql)
    // const result = await this.db.query(sql)
    // const scheduled = result.rows[0].is_time_scheduled // t/f
    const scheduled = true
    return scheduled
  }

  // update bins
  async updateBins() {
    console.log('updateBins', new Date())
    const now = new Date()
    // iterate over devices
    for (let device of this.devices) {
      // check if now is within scheduled time
      const scheduled = await this.isTimeScheduled(now)
      if (scheduled) {
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

  // check if a device was 'active' (ie has events on the given path),
  // between two times. returns true/false
  async getActive(deviceName, path, start, stop) {
    const sql = `select get_active('${deviceName}', '${path}', '${start.toISOString()}', '${stop.toISOString()}');`
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
    const sql = `select increment_bins(${device_id}, '${time}', '${field}');`
    console.log(sql)
    await this.db.query(sql)
  }
}
