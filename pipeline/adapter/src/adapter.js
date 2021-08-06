// adapter
// polls or subscribes to data via plugins, updates cache,
// updates shdr strings, passes them to agent via tcp.

// when adapter.js is run, it expects config in /data/setup and /data/models.
// /data/setup includes setup.yaml, which includes a list of devices to setup.

import net from 'net' // node lib for tcp
import * as common from './common.js'
import { Cache } from './cache.js'

// default server if none provided in model.yaml
const defaultServer = { protocol: 'shdr', host: 'adapter', port: 7878 }

// file system inputs
const driversFolder = './drivers' // eg mqtt-json - must start with '.'
// these folders are defined in pipeline.yaml with docker volume mappings
const setupFolder = '/data/setup' // incls setup.yaml etc
const modelsFolder = `/data/models` // incls ccs-pa/model.yaml etc

console.log(`Ladder99 Adapter`)
console.log(`Polls/subscribes to data, writes to cache, transforms to SHDR,`)
console.log(`posts to TCP.`)
console.log(`----------------------------------------------------------------`)

async function main() {
  // read /data/setup/setup.yaml file
  const setup = readSetupYaml()

  // define cache shared across all devices and sources
  const cache = new Cache()

  // iterate over device definitions from setup.yaml file
  const { devices } = setup
  for (const device of devices) {
    console.log(`Device`, device)
    const deviceId = device.id

    // each device gets a tcp connection to the agent
    console.log(`Creating TCP server for Agent to connect to...`)
    const tcp = net.createServer()

    // handle tcp connection from agent.
    // need to do this BEFORE registering plugins because those need the socket,
    // so know where to send SHDR strings.
    tcp.on('connection', async socket => {
      const remoteAddress = `${socket.remoteAddress}:${socket.remotePort}`
      console.log('New client connection from Agent at', remoteAddress)

      // each device can have multiple sources.
      //. are we sure we want to do that?
      // iterate over sources, load driver for that source, call init on it.
      for (const source of device.sources) {
        console.log(`Source`, source)
        const { model, driver, protocol, host, port } = source

        // import driver plugin
        const pathDriver = `${driversFolder}/${driver}.js` // eg './drivers/mqtt-json.js'
        console.log(`Importing driver code: ${pathDriver}...`)
        const { AdapterDriver } = await import(pathDriver)
        const plugin = new AdapterDriver()

        // get input handlers
        //. rename to cache-inputs.yaml
        const pathInputs = `${modelsFolder}/${model}/inputs.yaml`
        console.log(`Reading ${pathInputs}...`)
        const inputs = common.importYaml(pathInputs) || {}

        // get output handlers
        //. rename to cache-outputs.yaml
        const pathOutputs = `${modelsFolder}/${model}/outputs.yaml`
        console.log(`Reading ${pathOutputs}...`)
        const outputTemplates = (common.importYaml(pathOutputs) || {}).outputs

        // get types, if any
        const pathTypes = `${modelsFolder}/${model}/types.yaml`
        console.log(`Reading ${pathTypes}...`)
        const types = (common.importYaml(pathTypes) || {}).types

        if (outputTemplates) {
          // compile value js strings from outputs.yaml.
          // outputs is array of {key: string, value: function, dependsOn: string[]}.
          // eg [{ key: 'ac1-power_condition', value: 'FAULT', dependsOn: ['ac1-power_fault', 'ac1-power_warning'] }, ...]
          const outputs = getOutputs({
            templates: outputTemplates,
            types,
            deviceId,
          })

          // add outputs for each source to cache
          cache.addOutputs(outputs, socket)
        }

        // initialize driver plugin
        // note: this must be done AFTER getOutputs and addOutputs,
        // as that is where the dependsOn values are set, and this needs those.
        console.log(`Initializing driver for ${driver}...`)
        plugin.init({
          deviceId,
          driver,
          protocol,
          host,
          port,
          cache,
          inputs,
          socket,
        })
      }

      // handle incoming data - get PING from agent, return PONG
      socket.on('data', pingPong)

      function pingPong(buffer) {
        const str = buffer.toString().trim()
        if (str === '* PING') {
          const response = '* PONG 10000' //. msec - where get from?
          console.log(`Received PING from Agent - sending PONG:`, response)
          socket.write(response + '\n')
        } else {
          console.log('Received data:', str.slice(0, 20), '...')
        }
      }
    })

    // start tcp server for Agent to listen to, eg at adapter:7878
    //. rename to server(s)
    const { destinations } = device
    //. just handle one server/destination for now
    const server = destinations ? destinations[0] : defaultServer
    console.log(`Listen for Agent on TCP socket at`, server, `...`)
    // try {
    tcp.listen(server.port, server.host, () => {
      console.log(`Listening...`)
    })
    // } catch (error) {
    //   if (error.code === 'ENOTFOUND') {
    //     console.log(
    //       `TCP socket at ${destination.host}:${destination.port} not found.`
    //     )
    //   } else {
    //     throw error
    //   }
    // }
  }
}

main()

// get cache outputs from from outputs.yaml templates - do substitutions etc.
// each element defines a shdr output.
// templates is from outputs.yaml - array of { key, category, type, value, ... }.
// types is from types.yaml - object of objects with key:values.
// returns array of {key: string, value: int|str, dependsOn: string[]}.
// eg [{ key: 'ac1-power_condition', value: 'FAULT', dependsOn: ['ac1-power_fault', 'ac1-power_warning']}, ...]
// note: types IS used - it's in the closure formed by eval(str).
function getOutputs({ templates, types, deviceId }) {
  // console.log('getOutputs - iterate over output templates')
  const outputs = templates.map(template => {
    // replace all occurrences of <key> with `cache.get('...').value`.
    // eg <status_faults> => cache.get(`${deviceId}-status_faults`).value
    // note: .*? is a non-greedy match, so doesn't eat other occurrences also.
    const regexp1 = /(<(.*?)>)/gm
    // eg "<power_fault> ? 'FAULT' : <power_warning> ? 'WARNING' : 'NORMAL'"
    let valueStr = template.value || ''
    // eg "cache.get('ac1-power_fault').value ? 'FAULT' : cache.get('ac1-power_warning').value ? 'WARNING' : 'NORMAL'"
    // should be okay to ditch replaceAll because we have /g for the regexp
    //. test this with two cache refs in a string "<foo> + <bar>" etc
    // valueStr = valueStr.replaceAll( // needs node15
    valueStr = valueStr.replace(
      regexp1,
      `cache.get('${deviceId}-$2').value` // $2 is the matched substring
    )
    if (valueStr.includes('\n')) {
      valueStr = '{\n' + valueStr + '\n}'
    }

    // evaluate the value function -> eg 'FAULT'
    const value = cache => eval(valueStr)

    // get list of cache ids this calculation depends on.
    // get AFTER transforms, because user could specify a cache get manually.
    // eg dependsOn = ['ac1-power_fault', 'ac1-power_warning']
    const dependsOn = []
    const regexp2 = /cache\.get\('(.*?)'\).value/gm
    let match
    while ((match = regexp2.exec(valueStr)) !== null) {
      const key = match[1]
      dependsOn.push(key)
    }

    // get output object
    // eg {
    //   key: 'ac1-power_condition',
    //   value: 'FAULT',
    //   dependsOn: ['ac1-power_fault', 'ac1-power_warning'],
    //   category: 'CONDITION',
    //   type: 'VOLTAGE_DC',
    //   representation: undefined,
    // }
    const output = {
      // this is key in sense of shdr key
      //. assume each starts with deviceId? some might end with a number instead
      //. call this id, as it's such in the devices.xml
      key: `${deviceId}-${template.key}`,
      value, //. getValue
      dependsOn,
      category: template.category, // needed for cache getShdr fn
      type: template.type, // ditto
      representation: template.representation, // ditto
      nativeValue: template.nativeValue,
    }
    return output
  })
  return outputs
}

//. use common.js fn
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
