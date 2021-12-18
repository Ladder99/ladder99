// jobboss driver

import tedious from 'tedious'

export class AdapterDriver {
  // init({ deviceId, protocol, host, port, cache, inputs, socket }) {
  init({
    deviceId,
    protocol,
    host,
    port,
    database,
    username,
    password,
    cache,
    inputs,
    socket,
  }) {
    console.log(`Initialize JobBoss driver...`)

    const config = {
      server: host,
      authentication: {
        type: 'default',
        options: {
          userName: username,
          password,
        },
      },
      options: {
        database,
      },
    }

    const Connection = tedious.Connection
    const connection = new Connection(config)
    connection.on('connect', function (err) {
      console.log('JobBoss connected')
    })
    connection.connect()

    // function setAvailable() {
    //   cache.set(`${deviceId}-availability`, 'AVAILABLE')
    // }

    // function setUnavailable() {
    //   cache.set(`${deviceId}-availability`, 'UNAVAILABLE')
    //   cache.set(`${deviceId}-mass`, 'UNAVAILABLE')
    // }
  }
}
