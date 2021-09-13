// plex erp driver

import fetch from 'node-fetch' // https://github.com/node-fetch/node-fetch

const pollInterval = 1000 // msec
const reconnectInterval = 5000 // msec

export class AdapterDriver {
  init({ deviceId, protocol, host, port, cache, inputs, socket }) {
    console.log(`Initialize Plex ERP driver...`)

    const url = `${protocol}://${host}:${port}` // eg http://play:8080
    console.log('init test plugin', { deviceId, url })

    const timer = setInterval(poll, pollInterval)

    //. poll erp, send data directly to agent as shdr
    // ie skip the cache for now
    async function poll() {
      const timestamp = new Date().toISOString() //. get from json?
      const value = 'AVAILABLE' // : 'UNAVAILABLE'
      const shdr = `${timestamp}|${deviceId}/availability|${value}`
      console.log(shdr)
      socket.write(shdr + '\n')

      // try {
      //   const response = await fetch(url)
      //   const text = await response.text()
      //   const json = JSON.parse(text)
      //   console.log(json)
      //   const value = json.status === 'online' ? 'AVAILABLE' : 'UNAVAILABLE'
      //   const timestamp = new Date().toISOString() //. get from json
      //   const shdr = `${timestamp}|${deviceId}/connection|${value}` //.
      //   console.log(shdr)
      //   socket.write(shdr + '\n')
      // } catch (error) {
      //   if (error.code === 'ECONNREFUSED') {
      //     // ignore - will try again
      //   } else {
      //     throw error
      //   }
      // }
    }

    // write to cache
    // //. cache must have calcs defined for the diff keys via outputs.yaml
    // const key = 'connection'
    // const item = lookup($, part)
    // const cacheId = deviceId + '/' + key // eg 'pa1/fault_count'
    // // item.receivedTime = receivedTime
    // cache.set(cacheId, item) // save to the cache - may send shdr to tcp
  }
}
