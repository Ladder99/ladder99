// adapter
// subscribes to different mqtt topics,
// passes messages to topic handler fns to get shdr output string,
// then passes output on to the mtconnect agent via tcp.

import net from 'net' // node lib for tcp
import mqttlib from 'mqtt' // see https://www.npmjs.com/package/mqtt

// get device defs, eg DEVICES=CCS123@broker1:1883 CCS124@broker2:1883
const deviceDefs = (process.env.DEVICES || '').split(' ').map(d => d.split('@'))
const outputPort = Number(process.env.OUTPUT_PORT || 7878)
const outputHost = process.env.OUTPUT_HOST || 'localhost'

// define devices, incl plugin code
const devices = []
for (const deviceDef of deviceDefs) {
  const [serialNumber, url] = deviceDef
  const path = './plugins/' + serialNumber + '/adapter-dev.js' //. -dev for now
  // @ts-ignore top-level await warning
  const plugin = await import(path) // import plugin code
  const device = { serialNumber, url, plugin }
  devices.push(device)
}

let outputSocket
const cache = new Map() // a map lets you use set and get

console.log(`MTConnect Adapter`)
console.log(`Subscribes to MQTT topics, transforms to SHDR, posts to TCP.`)
console.log(`----------------------------------------------------------------`)

console.log(`Hit ctrl-c to stop adapter.`)
process.on('SIGINT', shutdown)

for (const device of devices) {
  console.log(`MQTT connecting to broker on`, device.url, `...`)

  const mqtt = mqttlib.connect(device.url) // returns instance of mqtt Client
  const plugin = device.plugin
  device.mqtt = mqtt // remember so can shut down

  // const clientId = mqtt.options.clientId //.
  // console.log({ clientId })

  mqtt.on('connect', function onConnect() {
    console.log(`MQTT connected to broker on`, device.url)

    // call plugin init fn
    plugin.init(mqtt, outputSocket)

    // subscribe to topics - get from plugin
    console.log(`MQTT subscribing to topics...`)
    for (const topic of Object.keys(plugin.handlers)) {
      console.log(`MQTT subscribing to topic ${topic}...`)
      mqtt.subscribe(topic)
    }
    console.log(`MQTT listening for messages...`)
  })

  // this form is better than passing the handler to mqtt broker above,
  // as we can use the cache etc.
  mqtt.on('message', function onMessage(topic, buffer) {
    console.log(`MQTT message received on topic ${topic}`)

    // const data = plugin.getData(buffer) // eg parse json string to js array
    const obj = plugin.unpack(topic, buffer) // eg parse json string to js array

    //. iterate through the data values and add them to the cache,
    // then when done, call the shdr update fn,
    // which for each shdr value change calls sendToOutput.
    // for (const datum of obj.data) {
    //   cache.set(datum.key, datum)
    // }

    // updateShdr()

    // this is obsolete...
    // const getOutput = plugin.getGetOutput(topic)
    // if (getOutput) {
    //   console.log(`Transforming data to output...`)
    //   //. don't transform data directly - pass it the data cache
    //   const output = getOutput(data) // data to output (eg shdr)
    //   console.log(output)
    //   //. add output to output cache
    //   sendToOutput(output)
    // } else {
    //   console.error(`No getOutput fn for topic ${topic}.`)
    // }
  })
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
  for (const device of devices) {
    if (device.mqtt) {
      device.mqtt.end()
    }
  }
  process.exit()
}
