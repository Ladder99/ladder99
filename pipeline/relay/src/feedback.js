// provide feedback to devices

//. will be replaced by MTConnect Interfaces

export class Feedback {
  constructor(db) {
    this.db = db
    this.timer = null
    this.devices = []
  }

  start(interval) {
    console.log('Relay Feedback - start')
    this.poll()
    // this.timer = setInterval(this.poll.bind(this), interval * 1000)
    // this.interval = interval // save for later
  }

  poll() {}

  // check if a device was 'active' (ie has events on the given path),
  // between two times. returns true/false
  //. problem - we want the connection to be ONE way to db? ie write only?
  async getActive(device, path, start, stop) {
    const sql = `
      select count(value) > 0 as active
      from history_all
      where
        device = '${device.name}'
        and path = '${path}'
        and time between '${start.toISOString()}' and '${stop.toISOString()}'
      limit 1;
    `
    console.log(sql)
    const result = await this.db.query(sql)
    const deviceWasActive = result.rows[0].active // t/f
    return deviceWasActive
  }
}
