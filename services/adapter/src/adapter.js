// adapter
// polls or subscribes to data via plugins, updates cache,
// updates shdr strings, passes them to agent via tcp.

import net from 'net' // node lib for tcp
// import fs from 'fs' // node lib for filesys
// import libyaml from 'js-yaml' // https://github.com/nodeca/js-yaml
import { Cache } from './cache.js'

// const yamlfile = 'src/volume/devices.yaml' //. specify on cmdline
// const yaml = fs.readFileSync(yamlfile, 'utf8')
// const yamltree = libyaml.load(yaml)
// console.log(yamltree)

const outputPort = Number(process.env.OUTPUT_PORT || 7878)
const outputHost = process.env.OUTPUT_HOST || 'localhost'

console.log(`MTConnect Adapter`)
console.log(`Polls/subscribes to data, writes to cache, transforms to SHDR,`)
console.log(`posts to TCP.`)
console.log(`----------------------------------------------------------------`)
console.log(`Hit ctrl-c to stop adapter.`)
process.on('SIGINT', shutdown)

console.log(`TCP creating server for agent...`)
const tcp = net.createServer()

let outputSocket
const sources = [] // remember so can end nicely

// handle tcp connection from agent or diode
tcp.on('connection', async socket => {
  outputSocket = socket
  const remoteAddress = `${socket.remoteAddress}:${socket.remotePort}`
  console.log('TCP new client connection from', remoteAddress)
  // handle incoming data - get PING from agent, return PONG
  socket.on('data', pingpong)
  function pingpong(buffer) {
    const str = buffer.toString().trim()
    if (str === '* PING') {
      const response = '* PONG 10000' //. msec
      console.log(`TCP received PING - sending PONG:`, response)
      socket.write(response + '\n')
    } else {
      console.log('TCP received data:', str.slice(0, 20), '...')
    }
  }

  // define cache shared across sources
  const cache = new Cache()

  // // load sources and init
  // const devices = yamltree.devices
  // // console.log(devices)
  // for (const device of devices) {
  //   console.log(device)
  //   //. iterate over sources, load plugin factory assoc with each,
  //   // construct new plugin for that source, call init on it.
  //   //. load calcs for this device, pass to... where?

  //   // const [deviceId, url] = device // eg 'CCS123', 'mqtt://broker1:1883'
  //   // const { deviceId } = device
  //   // const url = device.sources[0].url //.
  //   // console.log(`Importing code for device ${deviceId}...`)
  //   // const pluginPath = `/etc/adapter/${deviceId}.mjs`
  //   // const plugin = await import(pluginPath)
  //   // plugin.init({ cache, deviceId, socket })
  //   // plugins.push(plugin)
  // }
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
  // console.log(`Closing plugins`)
  // for (const plugin of plugins) {
  //   plugin.end()
  // }
  process.exit()
}
