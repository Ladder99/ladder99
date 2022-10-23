import net from 'net' // node lib for tcp

import * as lib from './common/lib.js'
import {
  getOutputs,
  getPlugin,
  getMacros,
  compileExpressions,
} from './helpers.js'

// setup a device by connecting to agent, initializing cache dataitems,
// and setting up each device source (loading plugins etc).
export async function setupDevice({ params, device, cache, client, devices }) {
  // console.log(`Device`, device) // don't print - might have passwords

  // each device gets a separate tcp connection to the agent
  console.log(`Adapter - creating TCP server for Agent to connect to...`)
  const tcp = net.createServer()
  tcp.on('connection', onConnection) // handle connection from agent

  // each device can have multiple sources.
  // iterate over sources, load driver for that source, call init on it,
  // save plugin (the driver instance) to source.
  for (const source of device.sources) {
    setupSource({ params, source, cache, client, devices, device })
  }

  // start tcp server for Agent to listen to, eg at adapter:7878
  const server = device.connection || params.defaultServer

  console.log(`Adapter - listen for Agent on TCP socket at`, server, `...`)

  // begin accepting connections on the specified port and host from agent.
  // see onConnection for next step.
  tcp.listen(server.port, server.host) // eg port:7878 host:adapter

  // handle connection from agent
  async function onConnection(socket) {
    const remoteAddress = `${socket.remoteAddress}:${socket.remotePort}`
    console.log('Adapter - new connection from Agent', remoteAddress)

    // tell cache and plugins about the tcp socket
    for (let source of device.sources) {
      cache.setSocket(source.outputs, socket) //. this should trigger sending all cache values
      if (source.plugin && source.plugin.setSocket) {
        source.plugin.setSocket(socket) // some drivers/plugins need direct socket connection, eg random.js
      }
    }

    // handle errors
    // eg "This socket has been ended by the other party"
    socket.on('error', onError)
    function onError(error) {
      console.log(error)
      // tell cache and plugins so they don't try to write to old socket
      for (let source of device.sources) {
        cache.setSocket(source.outputs, undefined)
        if (source.plugin && source.plugin.setSocket) {
          source.plugin.setSocket(undefined)
        }
      }
      // reconnection will automatically be handled by tcp.on connection
      // and onConnection, then new socket will be set on cache and plugins.
    }

    // handle ping/pong messages to/from agent,
    // so agent knows we're alive.
    socket.on('data', function onData(buffer) {
      const str = buffer.toString().trim()
      if (str === '* PING') {
        // received PING from Agent - send PONG
        const response = '* PONG 5000' //. msec - where from?
        socket.write(response + '\n')
      } else {
        console.log('Adapter received data:', str.slice(0, 20), '...')
      }
    })
  }
}

// -------------------------------------------------------

// setup a device source
// loads and initializes any plugin/driver code
async function setupSource({ params, source, cache, client, devices, device }) {
  //
  // console.log(`source`, source) // don't print - might have password etc
  const { module, driver, protocol, host, port, connection } = source

  // import driver plugin, eg micro.js or mqtt-json.js
  const plugin = await getPlugin(params.driversFolder, driver)
  source.plugin = plugin // save to source so on agent connection can tell it socket

  // get input handlers
  // these are interpreted by the driver
  const pathInputs = `${params.modulesFolder}/${module}/inputs.yaml`
  console.log(`Adapter reading ${pathInputs}...`)
  const inputs = lib.importYaml(pathInputs) || {} //. why not (...).inputs, as with outputs and types?

  // get output handlers
  // output yamls should all follow the same format, unlike input yamls.
  const pathOutputs = `${params.modulesFolder}/${module}/outputs.yaml`
  console.log(`Adapter reading ${pathOutputs}...`)
  const outputTemplates = (lib.importYaml(pathOutputs) || {}).outputs

  // get types, if any
  const pathTypes = `${params.modulesFolder}/${module}/types.yaml`
  console.log(`Adapter reading ${pathTypes}...`)
  const types = (lib.importYaml(pathTypes) || {}).types

  if (outputTemplates) {
    // compile value js strings from outputs.yaml.
    // source.outputs is array of {key: string, value: function, dependsOn: string[]}.
    // eg [{ key: 'ac1-power_condition', value: 'FAULT', dependsOn: ['ac1-power_fault', 'ac1-power_warning'] }, ...]
    // save those outputs onto the source object, so can call setSocket later.
    source.outputs = getOutputs({
      templates: outputTemplates,
      types,
      deviceId: device.id,
    })

    // add outputs for each source to cache.
    // these are not fully functional until we call cache.setSocket.
    // used to pass socket in here, but need to handle agent reconnection.
    cache.addOutputs(source.outputs)
  }

  // iterate over input handlers, if any
  const handlers = Object.values(inputs.handlers || [])
  for (let handler of handlers) {
    // get macros (regexs to extract references from code)
    const prefix = device.id + '-'
    const macros = getMacros(prefix, handler.accessor)

    // parse input handler code, get dependency graph, compile fns
    // eg maps could be { addr: { '%Z61.0': Set(1) { 'has_current_job' } }, ...}
    // use like
    //   const keys = [...maps.addr['%Z61.0']] // = ['has_current_job', 'foo_bar']
    // so can know what formulas need to be evaluated for some given addr
    const { augmentedExpressions, maps } = compileExpressions(
      handler.expressions,
      macros
    )
    handler.augmentedExpressions = augmentedExpressions
    handler.maps = maps

    // get set of '=' exprs to always run
    handler.alwaysRun = new Set()
    for (let key of Object.keys(augmentedExpressions)) {
      const expr = augmentedExpressions[key]
      if (expr.always) {
        handler.alwaysRun.add(key)
      }
    }
  }

  // initialize driver plugin
  // note: this must be done AFTER getOutputs and addOutputs,
  // as that is where the dependsOn values are set, and this needs those.
  //. add eg for each param
  console.log(`Adapter initializing driver for ${driver}...`)
  plugin.init({
    //. simpler/better to pass the whole source object here, in case has weird stuff in it.
    //. so - remove all the source subobjects below, and update all the drivers.
    source,

    client,
    device,
    driver, // eg 'random'

    // pass whole drivers array here also, in case driver needs to know other devices.
    // eg for jobboss - needs to know what workcenters/devices to look for.
    devices,

    //. consolidate these into a connect object
    protocol,
    host,
    port,

    cache,
    inputs,
    types,
    connection,
  })
}
