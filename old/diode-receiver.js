// diode receiver
// receives data on udp and transmits it to mtconnect agent via tcp.

import dgram from 'dgram' // UDP
import net from 'net' // TCP
import config from './config.js'

console.log(`Diode Receiver`)
console.log(`Receives UDP messages and forwards them via TCP.`)
console.log(`----------------------------------------------------------------`)

// TCP

console.log(`TCP creating socket...`)
const tcp = net.createServer()

// could create the udp socket inside the tcp connection event instead of doing this...
let tcpSocket = null

tcp.on('connection', socket => {
  tcpSocket = socket
  const remoteAddress = socket.remoteAddress + ':' + socket.remotePort
  console.log('TCP new client connection from', remoteAddress)
  socket.on('data', chunk => {
    const str = chunk.toString().trim()
    if (str === '* PING') {
      const response = '* PONG 10000'
      console.log(`TCP received PING - sending PONG:`, response)
      socket.write(response + '\n')
    } else {
      console.log('TCP connection data from %s: %j', remoteAddress, chunk)
      console.log(`TCP data as string:`, str)
    }
  })
  socket.on('end', () => {
    console.log('TCP connection closing...')
  })
  socket.once('close', () => {
    console.log('TCP connection from %s closed', remoteAddress)
  })
  socket.on('error', err => {
    console.error('TCP connection %s error: %j', remoteAddress, err)
  })
})

tcp.on('close', () => {
  console.log(`TCP server - all connections closed.`)
})

tcp.on('listening', () => {
  console.log('TCP server is listening...')
})

console.log(`TCP listening to socket at`, config.agent, `...`)
tcp.listen(config.agent.port, config.agent.host, () => {
  console.log('TCP listening to', tcp.address())
})

// UDP

console.log(`UDP creating socket...`)
const udp = dgram.createSocket('udp4')

udp.on('listening', () => {
  const address = udp.address()
  console.log(`UDP listening on`, address, `...`)
})

udp.on('message', (buffer, rinfo) => {
  console.log(`UDP got message from`, rinfo)
  const str = buffer.toString()
  console.log(str)
  console.log(`UDP pass msg to MTConnect Agent via TCP`, config.agent, `...`)
  tcpSocket.write(str + '\n')
})

udp.on('error', err => {
  console.error(`UDP error`, err)
  udp.close()
})

console.log(`UDP binding to socket at`, config.diode, `...`)
udp.bind(config.diode.port, config.diode.host)
