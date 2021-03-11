// device simulator
// publishes sample messages to mqtt broker

import mqtt from 'mqtt'
import messages from '../../config/messages.js'

const mqttHost = process.env.MQTT_HOST || 'localhost'
const mqttPort = Number(process.env.MQTT_PORT || 1883)
const mqttConfig = { host: mqttHost, port: mqttPort }

console.log(`Device`)
console.log(`Simulates a device sending MQTT messages.`)
console.log(`------------------------------------------------------------`)

console.log(`Connecting to MQTT broker on`, mqttConfig)
const client = mqtt.connect(mqttConfig)

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
