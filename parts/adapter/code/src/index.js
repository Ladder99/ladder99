// adapter
// subscribes to different mqtt topics,
// passes json messages to topic handler fns to get shdr string,
// then passes shdr on to the mtconnect agent via tcp.

import net from 'net' // node lib for tcp
import mqttlib from 'mqtt' // see https://www.npmjs.com/package/mqtt
import transforms from './transforms.js'

const folders = process.argv.slice(2) // eg ['./plugins/ccs-pa']

// import plugins
const plugins = {}
for (const folder of folders) {
  // @ts-ignore top-level await warning
  const plugin = await import(folder + '/adapter.js')
  const key = plugin.key // eg 'ccs-pa'
  plugins[key] = plugin
  // plugin.init(mqtt, adapter)
}

const mqttUrl = process.env.MQTT_URL || 'localhost:1883'
const outputPort = Number(process.env.OUTPUT_PORT || 7878)
const outputHost = process.env.OUTPUT_HOST || 'localhost'

let tcpSocket

console.log(`MTConnect Adapter`)
console.log(`Subscribes to MQTT topics, transforms to SHDR, posts to TCP.`)
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
mqtt.on('message', function onMessage(topic, buffer) {
  console.log(`MQTT message received on topic ${topic}`)
  const getData = plugin.getGetData(topic)
  if (getData) {
    const data = getData(buffer) // eg parse json string to js array
    const getOutput = plugin.getGetOutput(topic)
    if (getOutput) {
      console.log(`Transforming data to output...`)
      //. don't transform data directly - pass it the data cache
      const output = getOutput(data) // data to output (eg shdr)
      console.log(output)
      //. add output to output cache
      sendToOutput(output)
    } else {
      console.error(`No getOutput fn for topic ${topic}.`)
    }
  } else {
    console.error(`No getData fn for topic ${topic}.`)
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
function sendToOutput(output) {
  if (tcpSocket) {
    console.log(`TCP sending string with LF terminator...`)
    tcpSocket.write(output + '\n')
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
