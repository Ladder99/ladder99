// adapter
// polls or subscribes to data via plugins, updates cache,
// updates shdr strings, passes them to agent via tcp.

import fs from 'fs' // node lib for filesys
import libyaml from 'js-yaml' // https://github.com/nodeca/js-yaml
import net from 'net' // node lib for tcp
import { Cache } from './cache.js'

// load devices.yaml - see setups/demo/devices.yaml
const yamlfile = '/etc/setup/devices.yaml'
const yamltree = importYaml(yamlfile)
const { devices } = yamltree

console.log(`MTConnect Adapter`)
console.log(`Polls/subscribes to data, writes to cache, transforms to SHDR,`)
console.log(`posts to TCP.`)
console.log(`----------------------------------------------------------------`)

// define cache shared across devices and sources
const cache = new Cache()

// iterate over device definitions
for (const device of devices) {
  console.log({ device })
  const deviceId = device.id
  const { sources } = device

  // iterate over sources, load plugin for that source, call init on it.
  for (const source of sources) {
    console.log({ source })
    const { model, protocol, url } = source

    // import protocol plugin
    const path = `./plugins/${protocol}.js` // eg './plugins/mqtt-ccs.js' - must start with ./
    console.log(`Adapter importing plugin code: ${path}...`)
    // @ts-ignore top level await okay
    const plugin = await import(path)

    // initialize plugin
    console.log(`Adapter initializing plugin...`)
    plugin.init({ url, cache, deviceId })

    // import outputs
    const path2 = `/home/node/models/${model}/outputs.yaml`
    const outputTemplates = importYaml(path2).outputs
    // console.log({ outputTemplates })

    // import types
    const path3 = `/home/node/models/${model}/types.yaml`
    const types = importYaml(path3).types
    // console.log({ types })

    // compile outputs from yaml strings and save to source
    const outputs = getOutputs({ deviceId, outputTemplates, types })
    source.outputs = outputs
    // console.log({ outputs })
  }

  console.log(`TCP creating server for agent...`)
  const tcp = net.createServer()

  // handle tcp connection from agent or diode
  tcp.on('connection', async socket => {
    const remoteAddress = `${socket.remoteAddress}:${socket.remotePort}`
    console.log('TCP new client connection from', remoteAddress)

    // add outputs for each source to cache
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

  // start tcp connection for this device
  const { destinations } = device
  const destination = destinations[0] //. just handles one for now
  console.log(`TCP try listening to socket at`, destinations, `...`)
  tcp.listen(destination.port, destination.host)
}

// import the outputTemplate string defs and do replacements.
// note: types IS used - it's in the closure formed by eval(str).
function getOutputs({ outputTemplates, types, deviceId }) {
  const outputs = outputTemplates.map(template => {
    // build up dependsOn array during parse from what cache keys are seen
    const dependsOn = []
    // m will be undefined if no match, or array with elements 1,2,3 with contents
    //. handle multiple <>'s in a string also - how do? .* needs to be greedy for one thing
    //. also check if str is multiline - then need to wrap in braces?
    const regexp = /(.*)<(.*)>(.*)/
    const m = (template.value || '').match(regexp)
    let value = cache => template.value // by default just return string value
    // got match
    if (m) {
      const str = m[1] + `cache.get('${deviceId}-${m[2]}').value` + m[3]
      value = cache => eval(str) // evaluate the cache access string
      //. assume each starts with deviceId?
      const dependency = `${deviceId}-${m[2]}`
      dependsOn.push(dependency)
    }
    const output = {
      dependsOn,
      //. assume each starts with deviceId?
      //. call this id, as it's such in the devices.xml?
      key: `${deviceId}-${template.key}`,
      value, //. getValue?
    }
    return output
  })
  return outputs
}

/**
 * import a yaml file and parse to js struct
 * @returns {object}
 */
function importYaml(path, defaultTree = {}) {
  try {
    const yaml = fs.readFileSync(path, 'utf8')
    const yamlTree = libyaml.load(yaml)
    return yamlTree
  } catch (e) {
    console.log(e)
  }
  return defaultTree
}
