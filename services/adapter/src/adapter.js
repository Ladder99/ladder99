// adapter
// polls or subscribes to data via plugins, updates cache,
// updates shdr strings, passes them to agent via tcp.

import fs from 'fs' // node lib for filesys
import libyaml from 'js-yaml' // https://github.com/nodeca/js-yaml
import net from 'net' // node lib for tcp
import { Cache } from './cache.js'

// load devices.yaml
const yamlfile = '/etc/setup/devices.yaml' // see setups/demo/devices.yaml
const yaml = fs.readFileSync(yamlfile, 'utf8')
const yamltree = libyaml.load(yaml)
// @ts-ignore okay to cast here
const { devices } = yamltree

console.log(`MTConnect Adapter`)
console.log(`Polls/subscribes to data, writes to cache, transforms to SHDR,`)
console.log(`posts to TCP.`)
console.log(`----------------------------------------------------------------`)

// define cache shared across devices and sources
const cache = new Cache()

for (const device of devices) {
  console.log({ device })
  // load sources and init
  // iterate over sources, load plugin for that source, call init on it.
  const deviceId = device.id
  const { sources } = device
  for (const source of sources) {
    console.log({ source })
    const { model, type, url } = source
    const path = `./plugins/${type}.js` // eg './plugins/mqtt-ccs.js' - must start with ./
    console.log(`Adapter importing plugin code: ${path}...`)
    // @ts-ignore top level await okay
    const plugin = await import(path)
    //. also load inputs.yaml or js for this source, pass to plugin
    console.log(`Adapter initializing plugin...`)
    plugin.init({ url, cache, deviceId })

    //. import outputs calcs from each model and pass to cache.
    const path2 = `/home/node/models/${model}/build/outputs.js`
    // const outputs = (await import(path)).default
    // @ts-ignore top level await okay
    const module = await import(path2)
    console.log({ module })
    const outputs = module.getOutputs({ deviceId })
    console.log({ outputs })
    source.outputs = outputs
  }

  console.log(`TCP creating server for agent...`)
  const tcp = net.createServer()
  // handle tcp connection from agent or diode
  tcp.on('connection', async socket => {
    const remoteAddress = `${socket.remoteAddress}:${socket.remotePort}`
    console.log('TCP new client connection from', remoteAddress)

    for (const source of sources) {
      const { outputs } = source
      cache.addOutputs(outputs, socket)
    }

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

  // start tcp connection
  const { destinations } = device
  const destination = destinations[0] //. just handles one for now
  console.log(`TCP try listening to socket at`, destinations, `...`)
  tcp.listen(destination.port, destination.host)
}
