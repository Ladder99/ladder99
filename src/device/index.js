// device simulator
// publishes sample messages to mqtt.
// run with `node src/device`

import mqtt from 'mqtt'
import config from '../config.js'
import messages from './messages.js'

console.log(`Device`)
console.log(`Simulates a device sending MQTT messages.`)
console.log(`------------------------------------------------------------`)

console.log(`Connecting to MQTT broker on`, config.mqtt)
const client = mqtt.connect(config.mqtt)

client.on('connect', function onConnect() {
  console.log(`Publishing messages...`)
  for (const message of messages) {
    const s = JSON.stringify(message.json)
    console.log(`Topic ${message.topic}: ${s.slice(0, 40)}...`)
    client.publish(message.topic, s)
  }
  console.log(`Closing MQTT connection...`)
  client.end()
})
