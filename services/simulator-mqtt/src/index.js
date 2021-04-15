// simulator-mqtt
// simulates a device and publishes sample messages to mqtt broker

const mqttlib = require('mqtt')

const host = process.env.MQTT_HOST || 'localhost'
const port = Number(process.env.MQTT_PORT || 1883)
const deviceId = process.env.DEVICE_ID // eg 'ccs-pa-001'
const messagesFile = process.env.MESSAGES_FILE
const messageDelay = Number(process.env.MESSAGE_DELAY || 1000)
const loop = Boolean(process.env.LOOP || false)
const loopDelay = Number(process.env.LOOP_DELAY || 3000)

const clientId = deviceId || 'simulator-' + Math.random()
const config = { host, port, clientId }

const messages = require(messagesFile)
console.log({ messages })

console.log(`Simulator-mqtt`)
console.log(`Simulates a device sending MQTT messages.`)
console.log(`------------------------------------------------------------`)

console.log(`Connecting to MQTT broker on`, config)
const mqtt = mqttlib.connect(config)

mqtt.on('connect', async function onConnect() {
  console.log(`Publishing messages...`)
  do {
    for (const message of messages) {
      const topic = message.topic.replace('${deviceId}', deviceId)
      const payload = JSON.stringify(message.json)
      console.log(`Topic ${topic}: ${payload.slice(0, 40)}...`)
      mqtt.publish(topic, payload)
      await new Promise(resolve => setTimeout(resolve, messageDelay))
    }
    await new Promise(resolve => setTimeout(resolve, loopDelay))
  } while (loop)
  console.log(`Closing MQTT connection...`)
  mqtt.end()
})
