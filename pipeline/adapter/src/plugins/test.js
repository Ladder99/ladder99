// test plugin

import fetch from 'node-fetch'

export class AdapterPlugin {
  init({ deviceId, host, port, cache, inputs }) {
    console.log('init test plugin', { deviceId })
    //. poll the device, send data directly to agent as shdr?
    // or - idea was that diff devices could share a common cache for calcs?
    const receivedTime = new Date()
    // const payload = JSON.parse(message)
    const payload = { foo: 'bar' }
  }
}
