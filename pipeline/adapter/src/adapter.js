// adapter
// polls or subscribes to data via plugins, updates cache,
// updates shdr strings, passes them to agent via tcp.

import net from 'net' // node lib for tcp
import * as common from './common.js'
import { Cache } from './cache.js'

// default destination if none provided in model.yaml
const defaultDestination = { protocol: 'shdr', host: 'adapter', port: 7878 }

// file system inputs
const pluginsFolder = './plugins' // for protocol handlers, eg mqtt-json - must start with .
// these folders are defined in pipeline.yaml with docker volume mappings
const setupFolder = '/data/setup' // incls setup.yaml etc
const modelsFolder = `/data/models` // incls ccs-pa/model.yaml etc

console.log(`Ladder99 Adapter`)
console.log(`Polls/subscribes to data, writes to cache, transforms to SHDR,`)
console.log(`posts to TCP.`)
console.log(`----------------------------------------------------------------`)

async function main() {
  // read setup.yaml file
  const setup = readSetupYaml()

  // define cache shared across all devices and sources
  const cache = new Cache()

  // iterate over device definitions from setup.yaml file
  const { devices } = setup
  for (const device of devices) {
    // console.log({ device })
    const deviceId = device.id

    // each device gets a tcp connection to the agent
    console.log(`TCP creating server for agent...`)
    const tcp = net.createServer()

    // handle tcp connection from agent.
    // need to do this BEFORE registering plugins because those need the socket,
    // so know where to send SHDR strings.
    tcp.on('connection', async socket => {
      const remoteAddress = `${socket.remoteAddress}:${socket.remotePort}`
      console.log('TCP new client connection from', remoteAddress)

      // each device can have multiple sources.
      // iterate over sources, load plugin for that source, call init on it.
      for (const source of device.sources) {
        console.log({ source })
        const { model, protocol, host, port } = source

        // import protocol plugin
        const pathProtocol = `${pluginsFolder}/${protocol}.js` // eg './plugins/mqtt-json.js'
        console.log(`Adapter importing plugin code: ${pathProtocol}...`)
        const AdapterPlugin = await import(pathProtocol)
        const plugin = new AdapterPlugin()

        // get input handlers
        const pathInputs = `${modelsFolder}/${model}/inputs.yaml`
        console.log(`Reading ${pathInputs}...`)
        const inputs = common.importYaml(pathInputs) || {}

        // get output handlers
        const pathOutputs = `${modelsFolder}/${model}/outputs.yaml`
        console.log(`Reading ${pathOutputs}...`)
        const outputTemplates = (common.importYaml(pathOutputs) || {}).outputs

        // get types
        const pathTypes = `${modelsFolder}/${model}/types.yaml`
        console.log(`Reading ${pathTypes}...`)
        const types = (common.importYaml(pathTypes) || {}).types

        // compile output js strings from outputs.yaml and save to source
        const outputs = getOutputs({
          templates: outputTemplates,
          types,
          deviceId,
        })

        // add outputs for each source to cache
        cache.addOutputs(outputs, socket)

        // initialize plugin
        // note: this must be done AFTER getOutputs and addOutputs,
        // as that is where the dependsOn values are set, and this needs those.
        console.log(`Initializing ${protocol} plugin...`)
        plugin.init({ deviceId, host, port, cache, inputs })
      }

      // handle incoming data - get PING from agent, return PONG
      socket.on('data', pingPong)

      function pingPong(buffer) {
        const str = buffer.toString().trim()
        if (str === '* PING') {
          const response = '* PONG 10000' //. msec - where get from?
          console.log(`TCP received PING - sending PONG:`, response)
          socket.write(response + '\n')
        } else {
          console.log('TCP received data:', str.slice(0, 20), '...')
        }
      }
    })

    // start tcp connection for this device
    const { destinations } = device
    //. just handle one for now
    const destination = destinations ? destinations[0] : defaultDestination
    console.log(`TCP try listening to socket at`, destination, `...`)
    // console.log('here')
    // try {
    tcp.listen(destination.port, destination.host)
    // } catch (error) {
    //   if (error.code === 'ENOTFOUND') {
    //     console.log(
    //       `TCP socket at ${destination.host}:${destination.port} not found.`
    //     )
    //   } else {
    //     throw error
    //   }
    // }
    // console.log('there')
  }
}

main()

// get outputs from from outputs.yaml templates - do substitutions etc.
// templates is from outputs.yaml - array of { key, category, type, value },
// but can have other keys also.
// types is from types.yaml - object of objects with key:values
// note: types IS used - it's in the closure formed by eval(str)
// returns array of {key: string, value: function, dependsOn: string[]}
function getOutputs({ templates, types, deviceId }) {
  // console.log('getOutputs - iterate over output templates')
  const outputs = templates.map(template => {
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
      //. some might end with a number instead
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
  return outputs
}

function readSetupYaml() {
  // load setup, eg from setups/ccs-pa/setup.yaml
  const yamlfile = `${setupFolder}/setup.yaml`
  console.log(`Reading ${yamlfile}...`)
  const yamltree = common.importYaml(yamlfile)
  const setup = yamltree
  if (!setup) {
    console.log(`No ${yamlfile} available - please add one.`)
    process.exit(1)
  }
  return setup
}
