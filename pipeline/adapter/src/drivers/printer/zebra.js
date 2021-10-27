// zebra printer driver

import net from 'net' // node lib for tcp - https://nodejs.org/api/net.html
import * as parsers from './zebra-parsers.js'
import * as lib from '../../lib.js'

const pollInterval = 5000 // ms
const messagePauseTime = 500 // ms

export class AdapterDriver {
  init({ deviceId, protocol, host, port, cache, inputs, socket }) {
    console.log(`Initialize Zebra driver...`)

    // set cache values, which trigger shdr output
    // setCache('avail', 'AVAILABLE') // or UNAVAILABLE
    // setCache('emp', 'ON') // or OFF
    // setCache('state', 'ACTIVE') // or READY or WAIT
    // setCache('cond', 'WARNING') // or NORMAL or ERROR
    // setCache('msg', 'Some message')
    // setCache('dark', 30) // -30 to +30 or sthing
    // setCache('ht', 40) // head temp
    // setCache('fr', 10) // feedrate - print speed
    // setCache('tl', 100) // total length - odometer

    // TODO
    // setCache('uc', 3) // unload count = total lifetime label count

    let client // tcp connection
    let handler // current message handler
    while (client === undefined) {
      try {
        console.log(`Zebra driver connecting to`, { host, port }, '...')
        client = net.connect(port, host)
      } catch (err) {
        console.log(err)
        setAllUnavailable()
        // keep trying
        console.log(`Sleeping - will try to connect again...`)
        lib.sleep(1000)
      }
    }

    const commandHandlers = {
      // host query status - errors and warnings - see guide p205
      '~HQES': str => {
        if (str) {
          const ret = parsers.parseHQES(str)
          // A valid value for a data item in the category CONDITION can be one
          // of Normal, Warning, or Fault.
          //. set multiple conditions? eg a warning AND an error? mtc allows that.
          //. how handle in relay and db and viz?
          //. pass array of values here? let cache handle it?
          //. how handle multiple messages - eg some warnings, some faults?
          //. for now, just handle one condition value at a time
          if (ret.errors.length > 0) {
            setCache('cond', 'FAULT')
            setCache('msg', ret.msgs)
            setCache('state', 'INTERRUPTED') // execution state - see also HS handler below
          } else if (ret.warnings.length > 0) {
            setCache('cond', 'WARNING')
            setCache('msg', ret.msgs)
          } else {
            setCache('cond', 'NORMAL')
            setCache('msg')
          }
        } else {
          // set to unavailable
          setCache('cond')
          setCache('msg')
        }
      },

      // host status - p212
      // note: When a ~HS command is sent, the printer will not send a response
      // to the host if the printer is in one of these conditions:
      // MEDIA OUT, RIBBON OUT, HEAD OPEN, REWINDER FULL, HEAD OVER-TEMPERATURE
      '~HS': str => {
        if (str) {
          // get paper out flag, pause flag, buffer full flag, under/over temp flags,
          // head up flag, ribbon out flag, label waiting flag, labels remaining
          const ret = parsers.parseHS(str)
          // @ts-ignore
          setCache('labels_remaining', ret.labelsRemaining)
          // execution state:
          // -interrupted - if any error condition (set above in HQES handler)
          // -active - if Number(labelsRemaining) > 0
          // -ready - otherwise
          // execution MUST be READY, ACTIVE, INTERRUPTED, WAIT, FEED_HOLD,
          // STOPPED, OPTIONAL_STOP, PROGRAM_STOPPED, or PROGRAM_COMPLETED.
          setCache('state', ret.labelsRemaining > 0 ? 'ACTIVE' : 'READY')
        } else {
          setCache('state')
        }
      },

      // head diagnostic - get head temp, darkness adjust (?) - p199
      '~HD': str => {
        const ret = str ? parsers.parseHD(str) : {}
        setCache('ht', ret['Head Temp']) // Celsius
        setCache('dark', ret['Darkness Adjust']) // -30 to +30 or sthing
        setCache('fr', ret['Print Speed']) // feed rate - inches/sec
      },

      // host query odometer - nonresettable and user resettable 1 and 2
      '~HQOD': str => {
        const length = str ? parsers.parseHQOD(str) : undefined
        setCache('tl', length) // total length, inches
      },

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
      setCache('avail', 'AVAILABLE') // printer is alive
      setCache('emp', 'ON') // printer is on
      setInterval(poll, pollInterval)
    })

    // receive data from device, write to cache, output shdr to agent
    client.on('data', data => {
      setCache('avail', 'AVAILABLE') // printer is alive
      setCache('emp', 'ON') // printer is on
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
      //. try to reconnect - how?
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
        client.write(command + '\r\n')
        //. give printer some time to respond?
        await new Promise(resolve => setTimeout(resolve, messagePauseTime))
      }
    }

    // set all cache keys to UNAVAILABLE
    function setAllUnavailable() {
      // call all the cmd handlers with no param
      const handlers = Object.values(commandHandlers)
      handlers.forEach(handler => handler())
      setCache('avail')
      setCache('emp')
    }

    // set a cache key to the given value, which will trigger shdr output
    function setCache(key, value = 'UNAVAILABLE') {
      cache.set(`${deviceId}-${key}`, value)
    }
  }
}
