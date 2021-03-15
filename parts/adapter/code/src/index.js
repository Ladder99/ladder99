// adapter
// subscribes to different mqtt topics,
// passes messages to topic handler fns to get shdr output string,
// then passes output on to the mtconnect agent via tcp.

import net from 'net' // node lib for tcp
import mqttlib from 'mqtt' // see https://www.npmjs.com/package/mqtt

const serialNumbers = (process.env.DEVICE_SERIAL_NUMBERS || '').split(' ')
const urls = (process.env.DEVICE_URLS || 'localhost:1883').split(' ')
const outputPort = Number(process.env.OUTPUT_PORT || 7878)
const outputHost = process.env.OUTPUT_HOST || 'localhost'

// import plugin code
const plugins = {}
for (const serialNumber of serialNumbers) {
  const path = './plugins/' + serialNumber + '/adapter-dev.js' //. -dev for now
  // @ts-ignore top-level await warning
  const plugin = await import(path)
  plugins[serialNumber] = plugin
}

let outputSocket

console.log(`MTConnect Adapter`)
console.log(`Subscribes to MQTT topics, transforms to SHDR, posts to TCP.`)
console.log(`----------------------------------------------------------------`)

console.log(`Hit ctrl-c to stop adapter.`)
process.on('SIGINT', shutdown)

const mqtts = []
for (const url of urls) {
  console.log(`MQTT connecting to broker on`, url, `...`)
  const mqtt = mqttlib.connect(url) // returns instance of mqtt Client
  mqtts.push(mqtt)

  // const clientId = mqtt.options.clientId
  // console.log({ clientId })

  // const plugin = plugins[key]

  mqtt.on('connect', function onConnect() {
    console.log(`MQTT connected to broker on`, url)

    //. first call plugin init fn - which plugin?
    // plugin.init(mqtt, outputSocket) //?

    //. subscribe to topics - what topics? get from plugin
    // console.log(`MQTT subscribing to topics...`)
    // for (const topic of Object.keys(transforms)) {
    //   console.log(`MQTT subscribing to topic ${topic}...`)
    //   mqtt.subscribe(topic)
    // }
    // console.log(`MQTT listening for messages...`)

    for (const key of Object.keys(plugin.topics)) {
      const topic = plugin.topics[key]
      const handler = plugin.handlers[key]
      mqtt.subscribe(topic, handler)
    }
  })

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
  console.log(`MQTT closing connections...`)
  for (const mqtt of mqtts) {
    mqtt.end()
  }
  process.exit()
}
