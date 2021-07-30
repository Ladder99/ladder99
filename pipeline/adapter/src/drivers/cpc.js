// cpc autoclave driver

import net from 'net' // node lib for tcp

export class AdapterDriver {
  init({ deviceId, protocol, host, port, cache, inputs, socket }) {
    console.log(`CPC driver connecting to TCP server at`, { host, port }, '...')
    const client = net.connect(port, host, () => {
      console.log('CPC driver connected...')
    })
    client.on('error', function (error) {
      console.log('handled error')
      console.log(error)
    })

    // // handle tcp connection from cpc
    // tcp.on('connection', async socket => {
    //   const remoteAddress = `${socket.remoteAddress}:${socket.remotePort}`
    //   console.log('CPC driver new client connection from', remoteAddress)
    // })

    // // start tcp connection for this device
    // console.log(`CPC driver try listening to socket at`, { host, port }, `...`)
    // tcp.listen(port, host) // eg 10.20.30.101:9999
  }
}
