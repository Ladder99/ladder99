// jobboss driver

import tedious from 'tedious'

export class AdapterDriver {
  // init({ deviceId, protocol, host, port, cache, inputs, socket }) {
  init({ deviceId, protocol, cache, inputs, socket, connection }) {
    console.log(`Initialize JobBoss driver...`)

    setUnavailable()

    const config = {
      server: connection.host,
      authentication: {
        type: 'default',
        options: {
          userName: connection.username,
          password: connection.password,
        },
      },
      options: {
        database: connection.database,
      },
    }

    const Connection = tedious.Connection
    console.log(`Connecting to JobBoss database...`)
    console.log(config)
    const db = new Connection(config)
    db.on('connect', error => {
      console.log('Connected')
      setAvailable()
    })
    db.on('error', error => {
      console.log(error)
    })
    db.on('end', () => {
      console.log(`Disconnected from JobBoss database`)
      setUnavailable()
    })
    db.connect()

    function setAvailable() {
      cache.set(`${deviceId}-availability`, 'AVAILABLE')
    }

    function setUnavailable() {
      cache.set(`${deviceId}-availability`, 'UNAVAILABLE')
    }
  }
}
