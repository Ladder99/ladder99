// zebra printer driver

import net from 'net' // node lib for tcp - https://nodejs.org/api/net.html

const pollInterval = 5000 // ms

export class AdapterDriver {
  init({ deviceId, protocol, host, port, cache, inputs, socket }) {
    console.log(`Initialize Zebra driver...`)

    // //... for testing - delete this
    // // set cache values, which trigger shdr output
    // cache.set(`${deviceId}/avail`, { value: 'AVAILABLE' }) // or UNAVAILABLE
    // cache.set(`${deviceId}/emp`, { value: 'ON' }) // or OFF
    // cache.set(`${deviceId}/state`, { value: 'ACTIVE' }) // or READY or WAIT
    // cache.set(`${deviceId}/cond`, { value: 'WARNING' }) // or NORMAL or ERROR
    // cache.set(`${deviceId}/msg`, { value: 'Some message' })
    // cache.set(`${deviceId}/uc`, { value: 3 }) // unload count
    // cache.set(`${deviceId}/tl`, { value: 100 }) // total length
    // cache.set(`${deviceId}/fr`, { value: 10 }) // feedrate
    // cache.set(`${deviceId}/dark`, { value: 30 }) // -30 to +30 or sthing
    // cache.set(`${deviceId}/ht`, { value: 40 }) // head temp

    let client
    let handler
    try {
      console.log(`Zebra driver connecting to`, { host, port }, '...')
      client = net.connect(port, host)
    } catch (err) {
      console.log(err)
      setAllUnavailable()
      //. keep trying
    }

    const commandHandlers = {
      // host query status - errors and warnings - see guide p205

      '~HQES': str => {
        if (str) {
          //. parse response into keyvalues
          const regex =
            /.*PRINTER STATUS.*\r\n.*ERRORS.*(\d) (\d+) (\d+).*\r\n.*WARNINGS.*(\d) (\d+) (\d+).*/

          const match = str.match(regex)
          const values = match.slice(1)
          const binaries = values.map(value =>
            parseInt(value, 16).toString(2).split('')
          )

          const errorPresent = binaries[0] === '1'
          const warningPresent = binaries[3] === '1'

          setCache('avail', 'AVAILABLE')
          setCache('emp', 'ON') //. where get? or OFF
          setCache('state', 'ACTIVE') // or READY or WAIT
          setCache('cond', 'WARNING') // or NORMAL or ERROR
          setCache('msg', 'Some message')
        } else {
          // set all to unavail
          setCache('avail')
          setCache('emp')
          setCache('state')
          setCache('cond')
          setCache('msg')
        }
      },

      // host status
      // get paper out flag, pause flag, buffer full flag, under/over temp flags,
      // head up flag, ribbon out flag, label waiting flag
      '~HS': str => {},

      // host query odometer - nonresettable and user resettable 1 and 2
      '~HQOD': str => {},

      // host query maintenance info - messages
      // MAINTENANCE ALERT MESSAGES
      // CLEAN: PLEASE CLEAN PRINT HEAD
      // REPLACE: PLEASE REPLACE PRINT HEAD
      '~HQMI': str => {},

      // host query maintenance alert
      // ~HQMA
      // MAINTENANCE ALERT SETTINGS
      // HEAD REPLACEMENT INTERVAL: 1 km
      // HEAD REPLACEMENT FREQUENCY: 0 M
      // HEAD CLEANING INTERVAL: 0 M
      // HEAD CLEANING FREQUENCY: 0 M
      // PRINT REPLACEMENT ALERT: NO
      // PRINT CLEANING ALERT: NO
      // UNITS: C
      '~HQMA': str => {},

      // head diagnostic - get head temp, darkness adjust (?) - p199
      '~HD': str => {},
    }

    // connected to device - poll it for data by writing a command
    client.on('connect', () => {
      console.log(`Zebra driver connected...`)
      setInterval(poll, pollInterval)
    })

    // receive data from device, write to cache, output shdr to agent
    client.on('data', data => {
      // response starts with STX, has CR LF between each line, ends with ETX
      const str = data.toString() // eg 'PRINTER STATUS ERRORS: 1 00000000 00000005 WARNINGS: 1 00000000 00000002' // zpl returns
      console.log(`Zebra driver received response:\n`, str)
      //. make sure that we're handling the right command
      // eg set another var for current cmd being processed?
      if (handler) {
        handler(str)
      }
    })

    client.on('error', error => {
      console.log(error)
      setAllUnavailable()
    })

    client.on('end', () => {
      console.log('Zebra driver disconnected from server...')
      setAllUnavailable()
      //. try to reconnect
    })

    // 'poll' device using tcp client.write
    async function poll() {
      // iterate over cmds, set handler temporarily
      const commands = Object.keys(commandHandlers)
      for (let command of commands) {
        //. this is assuming that printer will respond to cmds in order - ehhhh
        handler = commandHandlers[command]
        console.log(`Zebra driver writing ${command}...`)
        //. do try/catch - handle disconnection, reconnection
        client.write(command + '\r\n') //
        // give printer some time to respond?
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }

    // set a cache key to the given value, which will trigger shdr output
    function setCache(key, value = 'UNAVAILABLE') {
      cache.set(`${deviceId}/${key}`, { value })
    }

    // set all cache keys to UNAVAILABLE
    function setAllUnavailable() {
      // call all the cmd handlers with no param
      const handlers = Object.values(commandHandlers)
      handlers.forEach(handler => handler())
    }
  }
}
