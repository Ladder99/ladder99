import net from 'net' // node lib for tcp

// make a tcp server and listen for Agent connections.
// address is eg { host: 'adapter', port: 7878 }.
// onAgentConnect and onAgentError are callbacks for when a connection is made or an error occurs.
export class AgentConnection {
  //
  start({ address, onAgentConnect, onAgentError }) {
    console.log(`AgentConnection creating TCP server for Agent to connect to`)

    // save callbacks
    this.onAgentConnect = onAgentConnect
    this.onAgentError = onAgentError

    const tcp = net.createServer()
    tcp.on('connection', this.handleConnection.bind(this))

    // start tcp server for Agent to listen to, eg at adapter:7878
    // begin accepting connections on the specified port and host from agent.
    // see handleConnection for next step.
    console.log(`AgentConnection listen for Agent on TCP socket at`, address)
    tcp.listen(address.port, address.host)
  }

  handleConnection(socket) {
    this.socket = socket
    const remoteAddress = `${socket.remoteAddress}:${socket.remotePort}`
    console.log('AgentConnection new connection from Agent', remoteAddress)
    socket.on('error', this.handleError.bind(this))
    socket.on('data', this.handleData.bind(this))
    this.onAgentConnect(socket) // call the callback
  }

  handleError(error) {
    console.log('AgentConnectiongent connection error', error)
    this.onAgentError(error) // call the callback
  }

  // handle ping/pong messages to/from agent, so it knows we're alive.
  handleData(buffer) {
    const str = buffer.toString().trim()
    if (str === '* PING') {
      const response = '* PONG 5000' //. msec - where from?
      this.socket.write(response + '\n')
    } else {
      console.log('AgentConnectioneceived data:', str.slice(0, 20), '...')
    }
  }
}
