// http-json driver

// polls data from http, parses as json

import fetch from 'node-fetch' // https://github.com/node-fetch/node-fetch

export class AdapterDriver {
  init({ deviceId, protocol, host, port, cache, inputs, socket }) {
    const url = `${protocol}://${host}:${port}` // eg http://play:8080
    console.log('init test plugin', { deviceId, url })

    const timer = setInterval(poll, 1000)

    //. poll device, send data directly to agent as shdr for now
    //. hmm, if connection broke, this would start piling up awaiting fn calls -
    //  how avoid that?
    async function poll() {
      try {
        const response = await fetch(url)
        const text = await response.text()
        const json = JSON.parse(text)
        console.log(json)
        //.
        const value = json.status === 'online' ? 'AVAILABLE' : 'UNAVAILABLE'
        const timestamp = new Date().toISOString() //. get from json
        const shdr = `${timestamp}|${deviceId}-connection|${value}` //..
        console.log(shdr)
        socket.write(shdr + '\n')
      } catch (error) {
        if (error.code === 'ECONNREFUSED') {
          // ignore - will try again
        } else {
          throw error
        }
      }
    }

    // write to cache
    // //. cache must have calcs defined for the diff keys in outputs.yaml
    // const key = 'connection'
    // const item = lookup($, part)
    // const cacheId = deviceId + '-' + key // eg 'pa1-fault_count'
    // // item.receivedTime = receivedTime
    // cache.set(cacheId, item) // save to the cache - may send shdr to tcp
  }
}
