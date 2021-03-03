// adapter
// subscribes to different mqtt topics,
// passes json messages to topic handler fns to get shdr string,
// then passes shdr on to the mtconnect agent via data diode.

// import dgram from 'dgram'
// import net from 'net'
import mqttlib from 'mqtt'
import transforms from './transforms.js'

const mqttHost = process.env.MQTT_HOST || 'localhost'
const mqttPort = Number(process.env.MQTT_PORT || 1883)
const mqttConfig = { host: mqttHost, port: mqttPort }

console.log(`MTConnect Adapter`)
console.log(`Subscribes to MQTT topics, transforms to SHDR, sends to diode.`)
console.log(`----------------------------------------------------------------`)

console.log(`Connecting to MQTT broker on`, mqttConfig, `...`)
const mqtt = mqttlib.connect([mqttConfig]) // pass { host, port }

// console.log(`Creating UDP socket...`)
// const udp = dgram.createSocket('udp4')

// console.log(`Creating TCP socket to diode`)
// let tcpSocket = null
// const tcp = net.createServer(socket => {
//   tcpSocket = socket
// })
// net.connect({ port, host }, () => {
//   // If there is no error, the server has accepted the request and created a new
//   // socket dedicated to us.
//   console.log('TCP connection established with the server.')
//   // The client can now send data to the server by writing to its socket.
//   // client.write('Hello, server.');
// })

console.log(`Hit ctrl-c to stop adapter.`)
process.on('SIGINT', shutdown)

// handle mqtt connection
mqtt.on('connect', function onConnect() {
  console.log(`Connected to MQTT broker on`, mqttConfig)
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
  // console.log(`Sending SHDR to diode over UDP at`, config.diode, `...`)
  // // see https://nodejs.org/api/dgram.html#dgram_socket_send_msg_offset_length_port_address_callback
  // udp.send(str, config.diode.port, config.diode.host, err => {
  //   if (err) {
  //     console.log(`UDP error:`, err)
  //   }
  // })
  // console.log(`Sending SHDR to diode over TCP at`, config.diodeSender, `...`)
  // tcpSocket.write(str)
}

function shutdown() {
  console.log(`Exiting...`)
  // console.log(`Closing UDP...`)
  // udp.close()
  // console.log(`Closing TCP...`)
  // tcpSocket.close()
  console.log(`Closing MQTT connection...`)
  mqtt.end()
  process.exit()
}
