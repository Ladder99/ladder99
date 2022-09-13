// setup a device by connecting to agent, initializing cache dataitems,
// and setting up each device source (loading plugins etc).

import { setupSource } from './setupSource.js'
import { Agent } from './agent.js'

export function setupDevice({
  setup,
  params,
  device,
  cache,
  client,
  devices,
  inputs,
}) {
  console.log(`Adapter setup device`, device.id) // don't print device obj - might have passwords

  // setup sources
  // each device can have multiple sources.
  // saves plugin (the driver instance) to the source object.
  for (const source of device.sources) {
    setupSource({
      setup,
      params,
      source,
      cache,
      client,
      devices,
      device,
      inputs,
    })
  }

  // get host and port
  // this works even if no outputs or agent specified
  const address = { ...params.agent, ...device?.outputs?.agent } // eg { host: adapter, port: 7878 }

  // start tcp server for Agent to listen to, eg at adapter:7878.
  // each device gets a separate tcp connection to the agent - same host, diff port.
  const agent = new Agent()
  agent.start({ address, onConnect, onError })

  // handle tcp connection
  function onConnect(socket) {
    // tell cache and plugins about the tcp socket
    for (let source of device.sources) {
      cache.setSocket(source.outputs, socket) //. this should trigger sending all cache values
      if (source.plugin && source.plugin.setSocket) {
        source.plugin.setSocket(socket) // some drivers/plugins need direct socket connection, eg random.js
      }
    }
  }

  // handle tcp errors
  // note: reconnection will automatically be handled by tcp.on connection
  // and onConnect, then new socket will be set on cache and plugins.
  function onError(error) {
    // tell cache and plugins so they don't try to write to old socket
    for (let source of device.sources) {
      cache.setSocket(source.outputs, undefined)
      if (source.plugin && source.plugin.setSocket) {
        source.plugin.setSocket(undefined)
      }
    }
  }
}
