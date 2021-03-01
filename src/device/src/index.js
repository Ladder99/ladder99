// device simulator
// publishes sample messages to mqtt broker

import mqtt from 'mqtt'
import messages from './messages.js'

const host = process.env.HOST || 'localhost'
const port = process.env.PORT || 1883
const config = { host, port }

console.log(`Device`)
console.log(`Simulates a device sending MQTT messages.`)
console.log(`------------------------------------------------------------`)

console.log(`Connecting to MQTT broker on`, config)
const client = mqtt.connect(config)

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
