// adapter
// subscribes to different mqtt topics,
// passes json messages to topic handler fns to get shdr string,
// then passes shdr on to the mtconnect agent via data diode.

import net from 'net'
import mqttlib from 'mqtt' // see https://www.npmjs.com/package/mqtt
import transforms from './transforms.js'

const mqttHost = process.env.MQTT_HOST || 'localhost'
const mqttPort = Number(process.env.MQTT_PORT || 1883)
const mqttUrl = `mqtt://${mqttHost}:${mqttPort}`

const outputHost = process.env.OUTPUT_HOST || 'localhost'
const outputPort = Number(process.env.OUTPUT_PORT || 7878)
const outputConfig = { host: outputHost, port: outputPort }

console.log(`MTConnect Adapter`)
console.log(`Subscribes to MQTT topics, transforms to SHDR, sends to diode.`)
console.log(`----------------------------------------------------------------`)

console.log(`Connecting to MQTT broker on`, mqttUrl, `...`)
const mqtt = mqttlib.connect(mqttUrl)

console.log(`Creating TCP output socket`)
const socket = new net.Socket()

console.log(`Connecting to output socket`, outputConfig, `...`)
socket.connect(outputConfig, () => {
  // handle mqtt connection
  mqtt.on('connect', function onConnect() {
    console.log(`Connected to MQTT broker on`, mqttUrl)
    console.log(`Subscribing to MQTT topics...`)
    for (const topic of Object.keys(transforms)) {
      console.log(`Subscribing to topic ${topic}...`)
      mqtt.subscribe(topic)
    }
    console.log(`Hit ctrl-c to stop adapter.`)
    process.on('SIGINT', shutdown)
    console.log(`Listening for MQTT messages...`)
  })

  // handle mqtt message
  mqtt.on('message', function onMessage(topic, messageBuffer) {
    const message = messageBuffer.toString()
    console.log(
      `Received MQTT message on topic ${topic}: ${message.slice(0, 20)}...`
    )
    const json = JSON.parse(message)
    const transformFn = transforms[topic]
    if (transformFn) {
      console.log(`Transforming MQTT message to SHDR...`)
      const shdr = transformFn(json)
      console.log(shdr)
      sendToDiode(shdr)
    } else {
      console.error(`No transformer for topic ${topic}.`)
    }
  })
})

// pass message on to diode
function sendToDiode(str) {
  console.log(`Sending SHDR to output TCP at`, outputConfig, `...`)
  socket.write(str)
}

function shutdown() {
  console.log(`Exiting...`)
  console.log(`Closing TCP output socket...`)
  socket.end()
  console.log(`Closing MQTT connection...`)
  mqtt.end()
  process.exit()
}
