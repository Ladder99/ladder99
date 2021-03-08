// adapter
// subscribes to different mqtt topics,
// passes json messages to topic handler fns to get shdr string,
// then passes shdr on to the mtconnect agent via tcp.

import net from 'net'
import mqttlib from 'mqtt' // see https://www.npmjs.com/package/mqtt
import transforms from './transforms.js'

const mqttUrl = process.env.MQTT_URL || 'localhost:1883'
const outputPort = Number(process.env.OUTPUT_PORT || 7878)
const outputHost = process.env.OUTPUT_HOST || 'localhost'

let tcpSocket

console.log(`MTConnect Adapter`)
console.log(`Subscribes to MQTT topics, transforms to SHDR, sends to diode.`)
console.log(`----------------------------------------------------------------`)

console.log(`Hit ctrl-c to stop adapter.`)
process.on('SIGINT', shutdown)

console.log(`MQTT connecting to broker on`, mqttUrl, `...`)
const mqtt = mqttlib.connect(mqttUrl)

// handle mqtt connection
mqtt.on('connect', function onConnect() {
  console.log(`MQTT connected to broker on`, mqttUrl)
  console.log(`MQTT subscribing to topics...`)
  for (const topic of Object.keys(transforms)) {
    console.log(`MQTT subscribing to topic ${topic}...`)
    mqtt.subscribe(topic)
  }
  console.log(`MQTT listening for messages...`)
})

// handle mqtt message
mqtt.on('message', function onMessage(topic, messageBuffer) {
  const message = messageBuffer.toString()
  console.log(
    `MQTT received message on topic ${topic}: ${message.slice(0, 20)}...`
  )
  const json = JSON.parse(message)
  const transformFn = transforms[topic]
  if (transformFn) {
    console.log(`Transforming JSON message to SHDR...`)
    const shdr = transformFn(json) // json to shdr
    console.log(shdr)
    sendToOutput(shdr)
  } else {
    console.error(`No transformer for topic ${topic}.`)
  }
})

//-------------------

console.log(`TCP creating server...`)
const tcp = net.createServer()

tcp.on('connection', socket => {
  tcpSocket = socket
  const remoteAddress = `${socket.remoteAddress}:${socket.remotePort}`
  console.log('TCP new client connection from', remoteAddress)
  socket.on('data', buffer => {
    const str = buffer.toString().trim()
    if (str === '* PING') {
      const response = '* PONG 10000'
      console.log(`TCP received PING - sending PONG:`, response)
      socket.write(response + '\n')
    } else {
      console.log('TCP received data:', str.slice(0, 20), '...')
    }
  })
})

console.log(`TCP try listening to socket at`, outputPort, outputHost, `...`)
tcp.listen(outputPort, outputHost)

// pass message on to output (agent or diode)
function sendToOutput(shdr) {
  if (tcpSocket) {
    console.log(`TCP sending string with LF terminator...`)
    tcpSocket.write(shdr + '\n')
  }
}

function shutdown() {
  console.log(`Exiting...`)
  if (tcpSocket) {
    console.log(`TCP closing socket...`)
    tcpSocket.end()
  }
  console.log(`MQTT closing connection...`)
  mqtt.end()
  process.exit()
}
