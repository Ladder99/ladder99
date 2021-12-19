// jobboss driver

import tedious from 'tedious' // mssql driver https://github.com/tediousjs/tedious

export class AdapterDriver {
  init({ deviceId, protocol, cache, inputs, socket, connection }) {
    console.log(`JobBoss - initialize driver...`)

    setUnavailable()

    const config = {
      server: connection.server,
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
    console.log(`JobBoss - connecting to database...`, connection.server)
    const db = new Connection(config)
    db.on('connect', error => {
      console.log('JobBoss - connected')
      setAvailable()
    })
    db.on('error', error => {
      console.log(error)
    })
    db.on('end', () => {
      console.log(`Jobboss - disconnected from database`)
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
