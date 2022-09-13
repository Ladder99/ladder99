// setup a device by connecting to agent, initializing cache dataitems,
// and setting up each device source (loading plugins etc).

import net from 'net' // node lib for tcp
import { setupSource } from './setupSource.js'

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

  // start tcp server for Agent to listen to, eg at adapter:7878.
  // each device gets a separate tcp connection to the agent - same host, diff port.
  const agent = new Agent()
  agent.start({ params, device, onConnect, onError })

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

class Agent {
  start({ params, device, onConnect, onError }) {
    console.log(`Adapter - creating TCP server for Agent to connect to...`)
    this.onConnect = onConnect
    this.onError = onError

    const tcp = net.createServer()
    tcp.on('connection', this.handleConnection.bind(this)) // handle connection from agent

    // get host port
    // this works even if no outputs specified
    this.server = { ...params.agent, ...device?.outputs?.agent } // eg { host: adapter, port: 7878 }

    // start tcp server for Agent to listen to, eg at adapter:7878
    // begin accepting connections on the specified port and host from agent.
    // see onConnection for next step.
    console.log(`Adapter - listen for Agent on TCP socket at`, server)
    tcp.listen(server.port, server.host)
  }

  handleConnection(socket) {
    this.socket = socket
    const remoteAddress = `${socket.remoteAddress}:${socket.remotePort}`
    console.log('Adapter - new connection from Agent', remoteAddress)
    socket.on('error', this.handleError.bind(this))
    socket.on('data', this.handleData.bind(this))
    this.onConnect(socket) // callback
  }

  handleError(error) {
    console.log('Adapter agent connection error', error)
    this.onError(error) // callback
  }

  // handle ping/pong messages to/from agent, so it knows we're alive.
  handleData(buffer) {
    const str = buffer.toString().trim()
    if (str === '* PING') {
      // received PING from Agent - send PONG
      const response = '* PONG 5000' //. msec - where from?
      this.socket.write(response + '\n')
    } else {
      console.log('Adapter received data:', str.slice(0, 20), '...')
    }
    // this.onData(buffer) // callback
  }
}
