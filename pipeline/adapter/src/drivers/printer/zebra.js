// zebra printer driver

import net from 'net' // node lib for tcp - https://nodejs.org/api/net.html
import * as parsers from './zebra-parsers.js'

const pollInterval = 5000 // ms

export class AdapterDriver {
  init({ deviceId, protocol, host, port, cache, inputs, socket }) {
    console.log(`Initialize Zebra driver...`)

    // //... for testing - delete this
    // // set cache values, which trigger shdr output
    // // cache.set(`${deviceId}/cond`, { value: 'WARNING' }) // or NORMAL or ERROR
    // // cache.set(`${deviceId}/msg`, { value: 'Some message' })
    // // cache.set(`${deviceId}/dark`, { value: 30 }) // -30 to +30 or sthing
    // // cache.set(`${deviceId}/ht`, { value: 40 }) // head temp

    // cache.set(`${deviceId}/avail`, { value: 'AVAILABLE' }) // or UNAVAILABLE
    // cache.set(`${deviceId}/emp`, { value: 'ON' }) // or OFF
    // cache.set(`${deviceId}/state`, { value: 'ACTIVE' }) // or READY or WAIT
    // cache.set(`${deviceId}/uc`, { value: 3 }) // unload count
    // cache.set(`${deviceId}/tl`, { value: 100 }) // total length
    // cache.set(`${deviceId}/fr`, { value: 10 }) // feedrate

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
          const ret = parsers.parseHQES(str)
          //. set multiple conditions? eg a warning AND an error? mtc allows that.
          //. how handle in relay and db and viz?
          //. pass array of values here? let cache handle it?
          //. how handle multiple messages - eg some warnings, some faults?
          //. for now, just handle one condition value at a time
          if (ret.errors.length > 0) {
            setCache('cond', 'ERROR')
            setCache('msg', ret.msgs)
          } else if (ret.warnings.length > 0) {
            setCache('cond', 'WARNING')
            setCache('msg', ret.msgs)
          } else {
            setCache('cond', 'NORMAL')
            setCache('msg')
          }
        } else {
          // set all to unavail
          setCache('cond')
          setCache('msg')
        }
      },

      // host status
      // note: When a ~HS command is sent, the printer will not send a response
      // to the host if the printer is in one of these conditions:
      // MEDIA OUT, RIBBON OUT, HEAD OPEN, REWINDER FULL, HEAD OVER-TEMPERATURE
      '~HS': str => {
        if (str) {
          // get paper out flag, pause flag, buffer full flag, under/over temp flags,
          // head up flag, ribbon out flag, label waiting flag
          const ret = parsers.parseHS(str)
          //. how know if it's printing? (ACTIVE)
          setCache('state', ret.pause ? 'WAIT' : 'READY') // ACTIVE or READY or WAIT
        } else {
          setCache('state')
        }
      },

      // head diagnostic - get head temp, darkness adjust (?) - p199
      '~HD': str => {
        const ret = str ? parsers.parseHD(str) : {}
        setCache('ht', ret['Head Temp']) // Celsius
        setCache('dark', ret['Darkness Adjust']) // -30 to +30 or sthing
      },

      // host query odometer - nonresettable and user resettable 1 and 2
      // '~HQOD': str => {},

      // host query maintenance info - messages
      // MAINTENANCE ALERT MESSAGES
      // CLEAN: PLEASE CLEAN PRINT HEAD
      // REPLACE: PLEASE REPLACE PRINT HEAD
      // '~HQMI': str => {},

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
      // '~HQMA': str => {},
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
