// simulator
// simulates a device and publishes sample messages to mqtt broker

// import mqttlib from 'mqtt'
const mqttlib = require('mqtt')
// import messages from './messages.js'

const host = process.env.MQTT_HOST || 'localhost'
const port = Number(process.env.MQTT_PORT || 1883)
const serialNumber = process.env.SERIAL_NUMBER // eg 'CCS123'
const clientId = serialNumber || 'simulator-' + Math.random()
const config = { host, port, clientId }
const messagesFile = process.env.MESSAGES_FILE

// @ts-ignore top-level await okay
// const messages = await import(messagesFile)
const messages = require(messagesFile)
console.log({ messages })

console.log(`Simulator`)
console.log(`Simulates a device sending MQTT messages.`)
console.log(`------------------------------------------------------------`)

console.log(`Connecting to MQTT broker on`, config)
const mqtt = mqttlib.connect(config)

mqtt.on('connect', function onConnect() {
  console.log(`Publishing messages...`)
  for (const message of messages) {
    const topic = message.topic.replace('${serialNumber}', serialNumber)
    const payload = JSON.stringify(message.json)
    console.log(`Topic ${topic}: ${payload.slice(0, 40)}...`)
    mqtt.publish(topic, payload)
  }
  console.log(`Closing MQTT connection...`)
  mqtt.end()
})
