// adapter
// polls or subscribes to data via plugins, updates cache,
// updates shdr strings, passes them to agent via tcp.

import net from 'net' // node lib for tcp
const yamllib = require('js-yaml') // https://github.com/nodeca/js-yaml
import { Cache } from './cache.js'

//. instead of this, load the devices.yaml config file as specified on cmdline.
// // eg DEVICES=CCS123@broker1:1883 CCS124@broker2:1883
// const devices = (process.env.DEVICES || '').split(' ').map(d => d.split('@'))

const outputPort = Number(process.env.OUTPUT_PORT || 7878)
const outputHost = process.env.OUTPUT_HOST || 'localhost'

console.log(`MTConnect Adapter`)
console.log(`Polls/subscribes to data, transforms to SHDR, posts to TCP.`)
console.log(`----------------------------------------------------------------`)
console.log(`Hit ctrl-c to stop adapter.`)
process.on('SIGINT', shutdown)

console.log(`TCP creating server for agent...`)
const tcp = net.createServer()

let outputSocket
const plugins = [] // plugins - remember them so can end nicely

// handle tcp connection
tcp.on('connection', async socket => {
  outputSocket = socket
  const remoteAddress = `${socket.remoteAddress}:${socket.remotePort}`
  console.log('TCP new client connection from', remoteAddress)
  // handle incoming data - get PING from agent, return PONG
  socket.on('data', buffer => {
    const str = buffer.toString().trim()
    if (str === '* PING') {
      const response = '* PONG 10000' //. msec
      console.log(`TCP received PING - sending PONG:`, response)
      socket.write(response + '\n')
    } else {
      console.log('TCP received data:', str.slice(0, 20), '...')
    }
  })

  // define cache shared across plugins
  const cache = new Cache()

  // load plugins and init
  for (const device of devices) {
    const [deviceId, url] = device // eg 'CCS123', 'mqtt://broker1:1883'
    console.log(`Importing code for device ${deviceId}...`)
    const pluginPath = `/etc/adapter/${deviceId}.mjs`
    const plugin = await import(pluginPath)
    plugin.init({ cache, deviceId, socket, mqttlib })
    plugins.push(plugin)
})

console.log(`TCP try listening to socket at`, outputPort, outputHost, `...`)
tcp.listen(outputPort, outputHost)

// exit nicely
function shutdown() {
  console.log(`Exiting...`)
  if (outputSocket) {
    console.log(`TCP closing socket...`)
    outputSocket.end()
  }
  console.log(`Closing plugins`)
  for (const plugin of plugins) {
    plugin.end()
  }
  process.exit()
}
