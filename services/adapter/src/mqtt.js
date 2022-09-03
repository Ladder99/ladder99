// mqtt driver
// subscribes to mqtt topics, receives messages, parses them.

import libmqtt from 'mqtt' // see https://www.npmjs.com/package/mqtt
import * as lib from './common/lib.js'

export class Mqtt {
  //
  constructor() {}

  init({ source, device, host, port, cache, inputs, types, advice }) {
    console.log('Adapter initializing mqtt driver')
    const url = `mqtt://${host}:${port}`

    // connect to mqtt broker/server
    console.log(`Adapter connecting to broker on ${url}...`)
    const mqtt = libmqtt.connect(url)

    // handle connection
    mqtt.on('connect', function onConnect() {
      console.log(`Adapter connected to broker on ${url}`)

      // register message handler
      console.log(`Adapter registering message handler`)
      mqtt.on('message', onMessage)

      // subscribe to any topics defined
      // const topic = replaceDeviceId(entry.topic)
      const topic = 'l99/B01000/cmd/modbus' //.
      console.log(`Adapter subscribing to ${topic}`)
      mqtt.subscribe(topic)

      // // publish to any topics defined
      // for (const entry of inputs.connect.publish || []) {
      //   const topic = replaceDeviceId(entry.topic)
      //   console.log(`MQTT publishing to ${topic}`)
      //   mqtt.publish(topic, entry.message)
      // }

      console.log(`Adapter listening for mqtt messages...`)
    })

    // handle incoming messages.
    // eg for ccs-pa have query, status, and read messages.
    // msgTopic - mqtt topic, eg 'l99/pa1/evt/query'
    // message - array of bytes (assumed to be a json string)
    function onMessage(msgTopic, message) {
      message = message.toString()

      console.log(`MQTT got message ${msgTopic}: ${message.slice(0, 140)}`)

      const payload = JSON.parse(message)

      payload.id
    }
  }
}
