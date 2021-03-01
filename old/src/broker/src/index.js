// broker
// mqtt broker that listens for messages and transmits them to subscribed clients

// not needed - can run an aedes image directly from docker-compose

import net from 'net'
import aedes from 'aedes'

const port = process.env.PORT || 1883

console.log(`MQTT Broker`)
console.log(`Listens for topic messages and sends them to subscribed clients.`)
console.log(`----------------------------------------------------------------`)

console.log(`Creating MQTT Broker...`)
const broker = aedes()

console.log(`Creating TCP server...`)
const server = net.createServer(broker.handle)

// When a client requests a connection with the server, the server creates a new
// socket dedicated to that client.
server.on('connection', function (socket) {
  console.log(
    new Date(),
    'A new connection to the server has been established.'
  )

  socket.on('end', function () {
    console.log(new Date(), 'Closing connection with the client...')
  })

  socket.on('error', function (err) {
    console.error(new Date(), `Error`, err)
  })
})

server.listen(port, function () {
  console.log(`MQTT Broker started - listening on ${port}...`)
})
