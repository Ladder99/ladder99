// provide feedback to devices

//. this will all be replaced by MTConnect Interfaces

import libmqtt from 'mqtt' // see https://www.npmjs.com/package/mqtt

// reset topic and message payload for mqtt
const topic = 'l99/B01000/evt/io'
const value = {
  unitid: 199,
  fc: 6,
  address: 142,
  quantity: 1,
  value: 5392,
}
const payload = { a5: value }

export class Feedback {
  constructor(db, setup) {
    this.db = db
    this.setup = setup
    this.timer = null
    this.mqtt = null
  }

  start(interval) {
    console.log('Feedback - start')

    const that = this

    // find marumatsu device
    for (let device of this.setup.devices) {
      if (device.name === 'Cutter' || device.name === 'Marumatsu') {
        const source = device.sources[0] // only one source for it, mqtt

        //. use source.connection.host etc
        const url = `mqtt://${source.host}:${source.port}`

        // connect to mqtt broker/server
        console.log(`Feedback - connecting to broker on ${url}...`)
        const mqtt = libmqtt.connect(url)

        // handle connection
        mqtt.on('connect', function onConnect() {
          console.log(`Feedback - connected to broker on ${url}`)

          // save connection
          that.mqtt = mqtt

          // poll the device and setup a timer to repeat it
          that.poll()
          that.timer = setInterval(that.poll.bind(that), interval * 1000)
        })
      }
    }
  }

  async poll() {
    const jobChanged = false
    if (jobChanged) {
      console.log(`Feedback - publishing to ${topic}...`)
      this.mqtt.publish(topic, payload)
    }
  }

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
