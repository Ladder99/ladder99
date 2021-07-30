// cpc autoclave driver

import net from 'net' // node lib for tcp

export class AdapterDriver {
  init({ deviceId, protocol, host, port, cache, inputs, socket }) {
    console.log(`CPC driver connecting to TCP server at`, { host, port }, '...')
    const client = net.connect(port, host, () => {
      console.log('CPC driver connected...')
    })
    client.on('error', function (error) {
      console.log(error)
    })
  }
}
