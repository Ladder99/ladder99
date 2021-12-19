// jobboss driver

import tedious from 'tedious' // mssql driver https://github.com/tediousjs/tedious
import * as lib from '../../lib.js'

export class AdapterDriver {
  async init({ deviceId, protocol, cache, inputs, socket, connection }) {
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
        encrypt: false,
        database: connection.database,
        // cryptoCredentialsDetails: {
        //   minVersion: 'TLSv1',
        // },
      },
    }

    const Connection = tedious.Connection
    console.log(`JobBoss - connecting to database...`, connection.server)
    const db = new Connection(config)
    db.on('connect', error => {
      console.log('JobBoss - connected')
      setAvailable()
      //. poll for current job info
      setInterval(poll, 5000)
    })
    db.on('error', error => {
      console.log(error)
      setUnavailable()
    })
    db.on('end', () => {
      console.log(`JobBoss - disconnected from database`)
      setUnavailable()
    })
    db.connect()

    async function poll() {
      console.log(`JobBoss - polling for job info...`)
    }

    function setAvailable() {
      cache.set(`${deviceId}-availability`, 'AVAILABLE')
    }

    function setUnavailable() {
      cache.set(`${deviceId}-availability`, 'UNAVAILABLE')
    }
  }
}
