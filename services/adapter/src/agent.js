import net from 'net' // node lib for tcp

export class Agent {
  start({ address, onConnect, onError }) {
    console.log(`Adapter - creating TCP server for Agent to connect to...`)

    this.onConnect = onConnect
    this.onError = onError

    const tcp = net.createServer()
    tcp.on('connection', this.handleConnection.bind(this))

    // start tcp server for Agent to listen to, eg at adapter:7878
    // begin accepting connections on the specified port and host from agent.
    // see handleConnection for next step.
    console.log(`Adapter - listen for Agent on TCP socket at`, address)
    tcp.listen(address.port, address.host)
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
      const response = '* PONG 5000' //. msec - where from?
      this.socket.write(response + '\n')
    } else {
      console.log('Adapter received data:', str.slice(0, 20), '...')
    }
  }
}
