// random data driver - for testing

const pollInterval = 1000 // msec

export class AdapterDriver {
  init({ deviceId, protocol, host, port, cache, inputs, socket }) {
    console.log(`Initialize Random driver...`)

    const timer = setInterval(poll, pollInterval)

    let previous = {}

    // send data directly to agent as shdr - ie skip the cache for now
    //. these should only send something if value CHANGED
    async function poll() {
      const timestamp = new Date().toISOString()
      const availability = Math.random() > 0.5 ? 'AVAILABLE' : 'UNAVAILABLE'
      const execution =
        availability === 'AVAILABLE'
          ? Math.random() > 0.5
            ? 'ACTIVE'
            : 'WAIT'
          : 'WAIT'
      const operator = Math.random() > 0.5 ? 'Alice' : 'Bob'

      let shdr = ''
      if (availability !== previous.availability) {
        shdr += `|${deviceId}/availability|${availability}`
      }
      if (execution !== previous.execution) {
        shdr += `|${deviceId}/execution|${execution}`
      }
      if (operator !== previous.operator) {
        shdr += `|${deviceId}/operator|${operator}`
      }
      if (shdr.length > 0) {
        shdr = timestamp + shdr
        console.log(shdr)
        socket.write(shdr + '\n') // write to agent
      }

      previous = { availability, execution, operator }

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
