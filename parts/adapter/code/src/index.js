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
const outputUrl = `${outputHost}:${outputPort}`

let tcpSocket

setTimeout(() => {
  console.log(`MTConnect Adapter`)
  console.log(`Subscribes to MQTT topics, transforms to SHDR, sends to diode.`)
  console.log(
    `----------------------------------------------------------------`
  )

  console.log(`Connecting to MQTT broker on`, mqttUrl, `...`)
  const mqtt = mqttlib.connect(mqttUrl)

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

  //-------------------

  console.log(`TCP creating socket...`)
  const tcp = net.createServer()

  tcp.on('connection', socket => {
    tcpSocket = tcp

    const remoteAddress = `${socket.remoteAddress}:${socket.remotePort}`
    console.log('TCP new client connection from', remoteAddress)

    socket.on('data', chunk => {
      const str = chunk.toString().trim()
      if (str === '* PING') {
        const response = '* PONG 10000'
        console.log(`TCP received PING - sending PONG:`, response)
        socket.write(response + '\n')
      } else {
        console.log('TCP connection data from %s: %j', remoteAddress, chunk)
        console.log(`TCP data as string:`, str)
        // udpSocket.write(chunk)
      }
    })

    socket.on('end', () => {
      console.log('TCP connection closing...')
    })
    socket.once('close', () => {
      console.log('TCP connection closed', remoteAddress)
    })
    socket.on('error', err => {
      console.error('TCP connection error', remoteAddress, err)
    })
  })

  console.log(`TCP try listening to socket at`, outputUrl, `...`)
  tcp.listen(outputUrl, () => {
    console.log('TCP listening to', tcp.address())
  })

  tcp.on('listening', () => {
    console.log('TCP server is listening...')
  })

  tcp.on('close', () => {
    console.log(`TCP server - all connections closed.`)
  })

  // console.log(`Creating TCP output socket`)
  // const socket = new net.Socket()

  // console.log(`Connecting to output socket`, outputUrl, `...`)
  // socket.connect(outputUrl, () => {
  //   console.log(`Connected to TCP output socket`)
  // })

  // pass message on to diode
  function sendToDiode(str) {
    if (tcpSocket) {
      console.log(`Sending SHDR to output TCP at`, outputUrl, `...`)
      tcpSocket.write(str)
    }
  }

  function shutdown() {
    console.log(`Exiting...`)
    if (tcpSocket) {
      console.log(`Closing TCP output socket...`)
      tcpSocket.end()
    }
    console.log(`Closing MQTT connection...`)
    mqtt.end()
    process.exit()
  }
}, 0) //.
