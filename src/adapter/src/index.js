// adapter
// subscribes to different mqtt topics,
// passes json messages to topic handler fns to get shdr string,
// then passes shdr on to the mtconnect agent via data diode.

import net from 'net'
import mqttlib from 'mqtt' // see https://www.npmjs.com/package/mqtt
import transforms from './transforms.js'

const mqttHost = process.env.MQTT_HOST || 'localhost'
const mqttPort = Number(process.env.MQTT_PORT || 1883)
const mqttConfig = { host: mqttHost, port: mqttPort }

const outputHost = process.env.OUTPUT_HOST || 'rabbitblack'
const outputPort = Number(process.env.OUTPUT_PORT || 5673)
const outputConfig = { host: outputHost, port: outputPort }

console.log(`MTConnect Adapter`)
console.log(`Subscribes to MQTT topics, transforms to SHDR, sends to diode.`)
console.log(`----------------------------------------------------------------`)

console.log(`Connecting to MQTT broker on`, mqttConfig, `...`)
// const mqtt = mqttlib.connect([mqttConfig]) // pass { host, port }
const url = 'mqtt://' + mqttHost + ':' + mqttPort
const mqtt = mqttlib.connect(url) // pass { host, port }

console.log(`Creating TCP socket to diode`)
// let tcpSocket = null
// const tcp = net.createServer(socket => {
//   // tcpSocket = socket
// })
// net.connect({ port, host }, () => {
//   // If there is no error, the server has accepted the request and created a new
//   // socket dedicated to us.
//   console.log('TCP connection established with the server.')
//   // The client can now send data to the server by writing to its socket.
//   // client.write('Hello, server.');
// })

const socket = new net.Socket()
console.log(`Connecting to server`, outputConfig, `...`)
socket.connect(outputConfig, () => {
  console.log(`Sending text...`)
  socket.write('Hello, server')
  // console.log(`Ending socket...`)
  // socket.end()
})

console.log(`Hit ctrl-c to stop adapter.`)
process.on('SIGINT', shutdown)

// handle mqtt connection
mqtt.on('connect', function onConnect() {
  console.log(`Connected to MQTT broker on`, { url })
  console.log(`Subscribing to MQTT topics...`)
  for (const topic of Object.keys(transforms)) {
    console.log(`Subscribing to topic ${topic}...`)
    mqtt.subscribe(topic)
  }
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

// pass message on to diode
function sendToDiode(str) {
  console.log(`Sending SHDR to diode over TCP at`, outputConfig, `...`)
  socket.write(str)
}

function shutdown() {
  console.log(`Exiting...`)
  console.log(`Closing TCP...`)
  socket.end()
  console.log(`Closing MQTT connection...`)
  mqtt.end()
  process.exit()
}
