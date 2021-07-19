// test plugin

// import http from 'http' // node lib
import fetch from 'node-fetch'

export class AdapterPlugin {
  init({ deviceId, host, port, cache, inputs }) {
    console.log('init', { deviceId })
    //. poll the device, send data directly to agent as shdr
    const receivedTime = new Date()
    // const payload = JSON.parse(message)
    const payload = { foo: 'bar' }
  }
}
