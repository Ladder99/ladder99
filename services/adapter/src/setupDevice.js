// setup a device by connecting to agent, initializing cache dataitems,
// and setting up each device source (loading plugins etc).

import net from 'net' // node lib for tcp
import { setupSource } from './setupSource.js'

export async function setupDevice({
  params,
  device,
  cache,
  client,
  devices,
  connections,
}) {
  // console.log(`Device`, device) // don't print - might have passwords

  // each device gets a separate tcp connection to the agent
  console.log(`Adapter - creating TCP server for Agent to connect to...`)
  const tcp = net.createServer()
  tcp.on('connection', onConnection) // handle connection from agent

  // each device can have multiple sources.
  // iterate over sources, load driver for that source, call init on it,
  // save plugin (the driver instance) to source.
  for (const source of device.sources) {
    setupSource({ params, source, cache, client, devices, device, connections })
  }

  // start tcp server for Agent to listen to, eg at adapter:7878
  const destinations = device.destinations || []
  const server = destinations[0] || params.defaultServer //. just handle one for now

  console.log(`Adapter - listen for Agent on TCP socket at`, server, `...`)

  // begin accepting connections on the specified port and host from agent.
  // see onConnection for next step.
  tcp.listen(server.port, server.host)

  // handle connection from agent
  async function onConnection(socket) {
    const remoteAddress = `${socket.remoteAddress}:${socket.remotePort}`
    console.log('Adapter - new connection from Agent', remoteAddress)

    // tell cache and plugins about the tcp socket
    for (let source of device.sources) {
      cache.setSocket(source.outputs, socket) //. this should trigger sending all cache values
      //. if have multiple plugins would need to set them all here
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

    // handle ping/pong messages to/from agent, so it knows we're alive.
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
