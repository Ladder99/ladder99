// adapter
// subscribes to different mqtt topics,
// passes messages to topic handler fns to get shdr output string,
// then passes output on to the mtconnect agent via tcp.

import net from 'net' // node lib for tcp
import mqttlib from 'mqtt' // see https://www.npmjs.com/package/mqtt
import { Cache } from './cache.js'

// eg DEVICES=CCS123@broker1:1883 CCS124@broker2:1883
const devices = (process.env.DEVICES || '').split(' ').map(d => d.split('@'))

const outputPort = Number(process.env.OUTPUT_PORT || 7878)
const outputHost = process.env.OUTPUT_HOST || 'localhost'

console.log(`MTConnect Adapter`)
console.log(`Subscribes to MQTT topics, transforms to SHDR, posts to TCP.`)
console.log(`----------------------------------------------------------------`)
console.log(`Hit ctrl-c to stop adapter.`)
process.on('SIGINT', shutdown)

//-------------------

console.log(`TCP creating server for agent...`)
const tcp = net.createServer()

let outputSocket
const mqtts = []

tcp.on('connection', async socket => {
  outputSocket = socket
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

  // define cache shared across devices
  const cache = new Cache()

  for (const device of devices) {
    const [serialNumber, url] = device

    console.log(`Importing code for device ${serialNumber}...`)
    const pluginPath = `/etc/adapter/${serialNumber}-dev.mjs` //. -dev for now
    const plugin = await import(pluginPath)

    console.log(`MQTT connecting to broker on`, url, `...`)
    const mqtt = mqttlib.connect(url)

    mqtt.on('connect', function onConnect() {
      console.log(`MQTT connected to broker on`, url)
      console.log(`MQTT calling plugin init and subscribing to topics...`)
      plugin.init(mqtt, cache, serialNumber, socket)
      console.log(`MQTT listening for messages...`)
    })
    mqtts.push(mqtt)
  }
})

console.log(`TCP try listening to socket at`, outputPort, outputHost, `...`)
tcp.listen(outputPort, outputHost)

function shutdown() {
  console.log(`Exiting...`)
  if (outputSocket) {
    console.log(`TCP closing socket...`)
    outputSocket.end()
  }
  console.log(`MQTT closing connections...`)
  for (const mqtt of mqtts) {
    mqtt.end()
  }
  process.exit()
}
