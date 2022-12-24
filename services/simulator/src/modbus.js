// import libmqtt from 'mqtt' // see https://www.npmjs.com/package/mqtt

// const url = 'mqtt://mosquitto:1883'

export class Simulator {
  //
  async start() {
    console.log(`Modbus start...`)

    // this.mqtt = libmqtt.connect(url)

    // this.mqtt.on('connect', () => {
    //   console.log(`mqtt connected`)
    //   // loop and publish random values with id=1 or 2, delay 1sec
    //   setInterval(() => {
    //     const topic = 'l99/test'
    //     const id = Math.floor(Math.random() * 2) + 1
    //     const user1 = Math.random() > 0.5 ? 'jon' : 'alice'
    //     const user2 = Math.random() * 100
    //     const payload = JSON.stringify({ id, user1, user2 })
    //     console.log(`mqtt publish ${topic}: ${payload}`)
    //     this.mqtt.publish(topic, payload)
    //   }, 1000)
    // })
  }
}
