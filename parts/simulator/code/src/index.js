// simulator
// simulates a device and publishes sample messages to mqtt broker

import mqttlib from 'mqtt'
import messages from './messages.js'

const mqttHost = process.env.MQTT_HOST || 'localhost'
const mqttPort = Number(process.env.MQTT_PORT || 1883)
const mqttClientId = process.env.MQTT_CLIENTID || 'simulator-' + Math.random()
const mqttConfig = { host: mqttHost, port: mqttPort, clientId: mqttClientId }

console.log(`Simulator`)
console.log(`Simulates a device sending MQTT messages.`)
console.log(`------------------------------------------------------------`)

console.log(`Connecting to MQTT broker on`, mqttConfig)
const mqtt = mqttlib.connect(mqttConfig)

mqtt.on('connect', function onConnect() {
  console.log(`Publishing messages...`)
  for (const message of messages) {
    const s = JSON.stringify(message.json)
    console.log(`Topic ${message.topic}: ${s.slice(0, 40)}...`)
    mqtt.publish(message.topic, s)
  }
  console.log(`Closing MQTT connection...`)
  mqtt.end()
})
