import libmqtt from 'mqtt' // see https://www.npmjs.com/package/mqtt

const url = 'mqtt://mosquitto:1883'

export class Simulator {
  //
  async start() {
    console.log(`mqtt create...`)

    this.mqtt = libmqtt.connect(url)

    this.mqtt.on('connect', () => {
      console.log(`mqtt connected`)
      // loop and publish random values with id=1 or 2, delay 1sec
      setInterval(() => {
        const id = Math.floor(Math.random() * 2) + 1
        const user1 = Math.random() > 0.5 ? 'jon' : 'alice'
        const user2 = Math.random() * 100
        const payload = { id, user1, user2 }
        this.mqtt.publish('l99/test', JSON.stringify(payload))
      }, 1000)
    })
  }
}
