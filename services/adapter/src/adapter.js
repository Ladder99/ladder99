// adapter
// polls or subscribes to data via plugins, updates cache,
// updates shdr strings, passes them to agent via tcp.

import fs from 'fs' // node lib for filesys
import libyaml from 'js-yaml' // https://github.com/nodeca/js-yaml
import net from 'net' // node lib for tcp
import { Cache } from './cache.js'

// file system inputs
const pluginsFolder = './plugins' // for protocol handlers, eg mqtt-json - must start with .
// note: caller needs to copy devices.yaml and model folders before running this app.
// see Justfile - copy-adapter-data and delete-adapter-data.
//. why do we need to specify ./src here? don't need it for plugins
const dataFolder = './src/data' // incl devices.yaml, models folder (copied from setups and models)
const modelsFolder = `${dataFolder}/models` // incl ccs-pa/model.yaml etc

// load devices.yaml - see setups/demo/devices.yaml
// const yamlfile = `${devicesFolder}/devices.yaml`
const yamlfile = `${dataFolder}/devices.yaml`
const yamltree = importYaml(yamlfile)
const { devices } = yamltree

console.log(`MTConnect Adapter`)
console.log(`Polls/subscribes to data, writes to cache, transforms to SHDR,`)
console.log(`posts to TCP.`)
console.log(`----------------------------------------------------------------`)

// define cache shared across devices and sources
const cache = new Cache()

// iterate over device definitions from devices.yaml
for (const device of devices) {
  console.log({ device })
  const deviceId = device.id

  console.log(`TCP creating server for agent...`)
  const tcp = net.createServer()

  // handle tcp connection from agent or diode.
  // need to do this BEFORE registering plugins because those need the socket
  // so know where to send SHDR strings.
  tcp.on('connection', async socket => {
    const remoteAddress = `${socket.remoteAddress}:${socket.remotePort}`
    console.log('TCP new client connection from', remoteAddress)

    // each device can have multiple sources.
    // iterate over sources, load plugin for that source, call init on it.
    for (const source of device.sources) {
      console.log({ source })
      const { model, protocol, url } = source

      // import protocol plugin
      const pathProtocol = `${pluginsFolder}/${protocol}.js` // eg './plugins/mqtt-ccs.js' -
      console.log(`Adapter importing plugin code: ${pathProtocol}...`)
      // @ts-ignore top level await okay
      const plugin = await import(pathProtocol)

      // get inputs
      const pathInputs = `${modelsFolder}/${model}/inputs.yaml`
      const inputs = importYaml(pathInputs)

      // get outputs
      const pathOutputs = `${modelsFolder}/${model}/outputs.yaml`
      const outputTemplates = importYaml(pathOutputs).outputs

      // get types
      const pathTypes = `${modelsFolder}/${model}/types.yaml`
      const types = importYaml(pathTypes).types

      // compile outputs from yaml strings and save to source
      const outputs = getOutputs({ outputTemplates, types, deviceId })

      // add outputs for each source to cache
      // @ts-ignore complex types
      cache.addOutputs(outputs, socket)

      // initialize plugin
      // note: this must be done AFTER getOutputs and addOutputs,
      // as that is where the dependsOn values are set, and this needs those.
      console.log(`Adapter initializing plugin...`)
      plugin.init({ url, cache, deviceId, inputs })
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
  const destination = destinations[0] //. just handle one for now
  console.log(`TCP try listening to socket at`, destinations, `...`)
  tcp.listen(destination.port, destination.host)
}

/**
 * import the outputTemplate string defs and do replacements.
 * @param {{outputTemplates: array, types: object, deviceId: string}} arg
 * @returns {{key: string, value: function, dependsOn: string[]}}[] - array of output objs
 */
// note: types IS used - it's in the closure formed by eval(str)
function getOutputs({ outputTemplates, types, deviceId }) {
  // console.log('getOutputs - iterate over output templates')
  const outputs = outputTemplates.map(template => {
    // replace all occurrences of <key> with `cache.get('...').value`.
    // eg <status_faults> => cache.get(`${deviceId}-status_faults`).value
    // note: .*? is a non-greedy match, so doesn't eat other occurrences also.
    const regexp1 = /(<(.*?)>)/gm
    let valueStr = template.value || ''
    valueStr = valueStr.replaceAll(
      regexp1,
      `cache.get('${deviceId}-$2').value` // $2 is the matched substring
    )
    if (valueStr.includes('\n')) {
      valueStr = '{\n' + valueStr + '\n}'
    }
    // console.log(`${template.key} new value: "${valueStr}"`)

    // evaluate the value function
    const value = cache => eval(valueStr)

    // get list of cache ids this calculation depends on.
    // get AFTER transforms, because user could specify a cache get manually.
    const dependsOn = []
    const regexp2 = /cache\.get\('(.*?)'\).value/gm
    let match
    while ((match = regexp2.exec(valueStr)) !== null) {
      const key = match[1]
      dependsOn.push(key)
    }
    // console.log({ dependsOn })

    // get output object
    const output = {
      //. assume each starts with deviceId?
      //. call this id, as it's such in the devices.xml?
      key: `${deviceId}-${template.key}`,
      value, //. getValue
      dependsOn,
      category: template.category, // needed for cache getShdr fn
      type: template.type, // ditto
      representation: template.representation, // ditto
    }
    return output
  })
  // @ts-ignore too strict typechecking
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
