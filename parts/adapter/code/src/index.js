// adapter
// subscribes to different mqtt topics,
// passes json messages to topic handler fns to get shdr string,
// then passes shdr on to the mtconnect agent via tcp.

import net from 'net' // node lib for tcp
import mqttlib from 'mqtt' // see https://www.npmjs.com/package/mqtt

// get device plugin keys, eg ['ccs-pa', 'foo']
const deviceKeys = (process.env.DEVICE_PLUGINS || '').split(' ')

// get mqtt input ports, eg ['mqtt://broker1:1883', 'mqtt://broker2:1883']
const mqttUrls = (process.env.MQTT_URLS || 'localhost:1883').split(' ')

const outputPort = Number(process.env.OUTPUT_PORT || 7878)
const outputHost = process.env.OUTPUT_HOST || 'localhost'

// import plugins
const plugins = {}
for (const deviceKey of deviceKeys) {
  const path = './plugins/' + deviceKey + '/adapter-dev.js' //. -dev for now
  // @ts-ignore top-level await warning
  const plugin = await import(path)
  plugins[deviceKey] = plugin
}

let outputSocket

console.log(`MTConnect Adapter`)
console.log(`Subscribes to MQTT topics, transforms to SHDR, posts to TCP.`)
console.log(`----------------------------------------------------------------`)

console.log(`Hit ctrl-c to stop adapter.`)
process.on('SIGINT', shutdown)

// const mqtts = []
for (const mqttUrl of mqttUrls) {
  console.log(`MQTT connecting to broker on`, mqttUrl, `...`)
  const mqtt = mqttlib.connect(mqttUrl) // returns an instance of mqtt Client
  const clientId = mqtt.options.clientId
  console.log({ clientId })

  // mqtts.push(mqtt)

  // const key = 'ccs-pa' //. where get this?
  // const plugin = plugins[key]

  // handle mqtt connection
  mqtt.on('connect', function onConnect(packet) {
    console.log(`MQTT connected to broker on`, mqttUrl)
    console.log({ packet })
    // console.log(`MQTT subscribing to topics...`)
    // for (const topic of Object.keys(transforms)) {
    //   console.log(`MQTT subscribing to topic ${topic}...`)
    //   mqtt.subscribe(topic)
    // }
    // console.log(`MQTT listening for messages...`)
  })

  // // handle mqtt message
  // mqtt.on('message', function onMessage(topic, buffer) {
  //   console.log(`MQTT message received on topic ${topic}`)
  //   const getData = plugin.getGetData(topic)
  //   if (getData) {
  //     const data = getData(buffer) // eg parse json string to js array
  //     const getOutput = plugin.getGetOutput(topic)
  //     if (getOutput) {
  //       console.log(`Transforming data to output...`)
  //       //. don't transform data directly - pass it the data cache
  //       const output = getOutput(data) // data to output (eg shdr)
  //       console.log(output)
  //       //. add output to output cache
  //       sendToOutput(output)
  //     } else {
  //       console.error(`No getOutput fn for topic ${topic}.`)
  //     }
  //   } else {
  //     console.error(`No getData fn for topic ${topic}.`)
  //   }
  // })
}

//-------------------

console.log(`TCP creating server...`)
const tcp = net.createServer()

tcp.on('connection', socket => {
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
})

console.log(`TCP try listening to socket at`, outputPort, outputHost, `...`)
tcp.listen(outputPort, outputHost)

// pass message on to output (agent or diode)
function sendToOutput(output) {
  if (outputSocket) {
    console.log(`TCP sending string with LF terminator...`)
    outputSocket.write(output + '\n')
  }
}

function shutdown() {
  console.log(`Exiting...`)
  if (outputSocket) {
    console.log(`TCP closing socket...`)
    outputSocket.end()
  }
  // console.log(`MQTT closing connection...`)
  // mqtt.end()
  process.exit()
}
