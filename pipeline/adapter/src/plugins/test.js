// test plugin

import fetch from 'node-fetch'

export class AdapterPlugin {
  init({ deviceId, host, port, cache, inputs }) {
    console.log('init test plugin', { deviceId })
    //. poll the device, send data directly to agent as shdr?
    // or - idea was that diff devices could share a common cache for calcs?
    const receivedTime = new Date()
    // const payload = JSON.parse(message)
    const payload = { connection: 'online' }
    // write to cache
    const key = 'connection'
    const item = lookup($, part)
    const cacheId = deviceId + '-' + key // eg 'pa1-fault_count'
    // item.receivedTime = receivedTime
    cache.set(cacheId, item) // save to the cache - may send shdr to tcp
  }
}
