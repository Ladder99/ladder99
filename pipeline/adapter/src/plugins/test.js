// test plugin

import fetch from 'node-fetch'

export class AdapterPlugin {
  async init({ deviceId, protocol, host, port, cache, inputs, socket }) {
    const url = `${protocol}://${host}:${port}` // eg http://play:8080
    console.log('init test plugin', { deviceId, url })
    const timer = setInterval(poll, 1000)

    //. hmm, if connection broke, this would start piling up awaiting fn calls...
    async function poll() {
      const response = await fetch(url)
      const text = await response.text()
      const json = JSON.parse(text)
      console.log(json)
    }

    // //. poll device, send data directly to agent as shdr
    // const timestamp = new Date()
    // // const payload = JSON.parse(message)
    // // const payload = { connection: 'online' }
    // const shdr = `${timestamp}|connection|AVAILABLE`
    // socket.write(shdr + '\n')

    // write to cache
    // //. but cache must have calcs defined for the diff keys eh?
    // const key = 'connection'
    // const item = lookup($, part)
    // const cacheId = deviceId + '-' + key // eg 'pa1-fault_count'
    // // item.receivedTime = receivedTime
    // cache.set(cacheId, item) // save to the cache - may send shdr to tcp
  }
}
