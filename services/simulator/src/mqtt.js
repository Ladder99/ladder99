import libmqtt from 'mqtt' // see https://www.npmjs.com/package/mqtt

const url = 'mqtt://mosquitto:1883'

export class Simulator {
  //
  async start() {
    console.log(`mqtt create...`)

    this.mqtt = libmqtt.connect(url)

    this.mqtt.on('connect', () => {
      console.log(`mqtt connected`)
      const payload = { id: 1, name: 'foo', value: 123 }
      this.mqtt.publish('l99/test', JSON.stringify(payload))
    })
  }
}
