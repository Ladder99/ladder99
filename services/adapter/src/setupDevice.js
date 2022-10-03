// setup a device by connecting to agent, initializing cache dataitems,
// and setting up each device source (loading plugins etc).

import { setupSource } from './setupSource.js'
import { AgentConnection } from './agentConnection.js'

export function setupDevice({
  setup,
  params,
  device,
  cache,
  client,
  devices,
  providers,
}) {
  console.log(`Adapter setup device`, device.name) // don't print device obj - might have passwords

  // setup sources
  // each device can have multiple sources.
  // saves plugin (the driver instance) to the source object.
  for (const source of device?.sources || []) {
    setupSource({
      setup,
      params,
      source,
      cache,
      client,
      devices,
      device,
      providers,
    })
  }

  // get host and port, eg { host: adapter, port: 7878 }
  // this works even if no outputs or agent are specified.
  // eg in setup.yaml,
  //   # define any outputs for this device
  //   outputs:
  //     agent:
  //       port: 7878 # differs by device - must match value in agent.cfg
  const address = { ...params.agent, ...device?.outputs?.agent }

  // start tcp server for Agent to listen to, eg at adapter:7878.
  // each device gets a separate tcp connection to the agent - same host, diff port.
  const agentConnection = new AgentConnection()
  agentConnection.start({ address, onAgentConnect, onAgentError }) // pass in callbacks

  // callback to handle tcp connection
  function onAgentConnect(socket) {
    // tell cache and plugins about the tcp socket
    for (let source of device.sources) {
      cache.setSocket(source.outputs, socket) // this should trigger sending all cache values
      // note: source.plugin is the instantiated driver object for the source,
      // which may not have a setSocket fn.
      if (source.plugin?.setSocket) {
        source.plugin.setSocket(socket) // some drivers/plugins need direct socket connection, eg random.js
      }
    }
  }

  // callback to handle tcp errors
  // note: reconnection will automatically be handled by tcp.on connection and
  // onAgentConnect, then new socket will be set on cache and plugins.
  function onAgentError(error) {
    // tell cache and plugins so they don't try to write to old socket
    for (let source of device.sources) {
      cache.setSocket(source.outputs, undefined)
      if (source.plugin && source.plugin.setSocket) {
        source.plugin.setSocket(undefined) // clear socket
      }
    }
  }
}
