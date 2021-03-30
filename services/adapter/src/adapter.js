// adapter
// polls or subscribes to data via plugins, updates cache,
// updates shdr strings, passes them to agent via tcp.

import fs from 'fs' // node lib for filesys
import libyaml from 'js-yaml' // https://github.com/nodeca/js-yaml
import net from 'net' // node lib for tcp
import { Cache } from './cache.js'
// import calcs from './calcs'

// load devices.yaml
const yamlfile = '/etc/adapter/devices.yaml' // see setups/demo/volumes/adapter
const yaml = fs.readFileSync(yamlfile, 'utf8')
const yamltree = libyaml.load(yaml)
// @ts-ignore okay to cast here
const { devices } = yamltree

console.log(`MTConnect Adapter`)
console.log(`Polls/subscribes to data, writes to cache, transforms to SHDR,`)
console.log(`posts to TCP.`)
console.log(`----------------------------------------------------------------`)

// define cache shared across sources
const cache = new Cache()

for (const device of devices) {
  console.log({ device })
  // load sources and init
  // iterate over sources, load plugin for that source, call init on it.
  //. also load calcs for this device, pass to plugin or cache
  const { sources } = device
  const { deviceId } = device.properties
  for (const source of sources) {
    const { type, url } = source
    const path = `./plugins/${type}.js` // eg './plugins/mqtt-ccs.js' - must start with ./
    console.log(`Importing plugin code: ${path}...`)
    // @ts-ignore top level await okay
    const plugin = await import(path)
    console.log(`Initializing plugin...`)
    plugin.init({ url, cache, deviceId })
  }

  console.log(`TCP creating server for agent...`)
  const tcp = net.createServer()
  // handle tcp connection from agent or diode
  tcp.on('connection', async socket => {
    const remoteAddress = `${socket.remoteAddress}:${socket.remotePort}`
    console.log('TCP new client connection from', remoteAddress)
    // import calcs and pass to cache
    const calcs = (await import('./calcs.js')).default
    cache.addCalcs(calcs, socket)
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
  })
  const { output } = device
  console.log(`TCP try listening to socket at`, output, `...`)
  tcp.listen(output.port, output.host)
}
