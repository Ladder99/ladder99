// zebra printer driver

import net from 'net' // node lib for tcp - https://nodejs.org/api/net.html
import * as parsers from './zebra-parsers.js'
import * as lib from '../../lib.js'

// want this low as possible - see below comment
const pollInterval = 3000 // ms
// each command needs some time to wait for printer to respond
// and currently we have 4 commands, so this times that is total time to
// loop through all commands. keep it under the pollInterval.
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
    // let msgs // error and warning messages, eg 'ERROR: Paper Out, WARNING: Ribbon Low'
    let errors // list of error messages, eg ['Paper Out']
    let warnings // list of warning messages

    // note: net.connect() doesn't seem to time out - just waits there,
    // so try catch loop probably unneeded.
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

    // each command handler should handle a null/undefined response
    // by setting each dataitem it handles to undefined.
    const commandHandlers = {
      // host status - p212
      // manual says: When a ~HS command is sent, the printer will not send a
      // response to the host if the printer is in one of these conditions:
      // MEDIA OUT, RIBBON OUT, HEAD OPEN, REWINDER FULL, HEAD OVER-TEMPERATURE
      // (but how accurate is the manual? eg some printers don't respond to HQES)
      '~HS': response => {
        if (response) {
          // get paper out flag, pause flag, buffer full flag, under/over temp flags,
          // head up flag, ribbon out flag, label waiting flag, labels remaining
          const ret = parsers.parseHS(response)
          // @ts-ignore
          setCache('labels_remaining', ret.labelsRemaining)
          // execution state:
          // execution MUST be READY, ACTIVE, INTERRUPTED, WAIT, FEED_HOLD,
          // STOPPED, OPTIONAL_STOP, PROGRAM_STOPPED, or PROGRAM_COMPLETED.
          //   interrupted - if any error condition
          //   active - if labelsRemaining > 0
          //   ready - otherwise
          // note: poll() fn will overwrite this with interrupted if any errors found
          setCache('state', ret.labelsRemaining > 0 ? 'ACTIVE' : 'READY')
          // handle errors and warnings
          if (ret.errors) errors.push(...ret.errors)
          if (ret.warnings) warnings.push(...ret.warnings)
        } else {
          setCache('labels_remaining')
          setCache('state')
        }
      },

      // host query status - errors and warnings - see guide p205
      '~HQES': response => {
        if (response) {
          const ret = parsers.parseHQES(response)
          // A valid value for a data item in the category CONDITION can be one
          // of Normal, Warning, or Fault.
          //. set multiple conditions? eg a warning AND an error? mtc allows that.
          //. how handle in relay and db and viz?
          //. pass array of values here? let cache handle it?
          //. how handle multiple messages - eg some warnings, some faults?
          //. for now, just handle one condition value at a time
          // handle errors and warnings
          if (ret.errors) errors.push(...ret.errors)
          if (ret.warnings) warnings.push(...ret.warnings)
        }
      },

      // head diagnostic - get head temp, darkness adjust (?) - p199
      '~HD': response => {
        const ret = response ? parsers.parseHD(response) : {}
        setCache('ht', ret['Head Temp']) // Celsius
        setCache('dark', ret['Darkness Adjust']) // -30 to +30 or sthing
        setCache('fr', ret['Print Speed']) // feed rate - inches/sec
      },

      // host query odometer - nonresettable and user resettable 1 and 2
      '~HQOD': response => {
        const length = response ? parsers.parseHQOD(response) : undefined
        setCache('tl', length) // total length, inches
      },

      // host query maintenance info - messages
      // MAINTENANCE ALERT MESSAGES
      // CLEAN: PLEASE CLEAN PRINT HEAD
      // REPLACE: PLEASE REPLACE PRINT HEAD
      // '~HQMI': response => {},

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
      // '~HQMA': response => {},
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
      //. make sure all are in consistent state here? or in poll fn?
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
      // clear lists
      errors = []
      warnings = []
      // iterate over cmds, set handler temporarily
      const commands = Object.keys(commandHandlers)
      for (let command of commands) {
        //. this is assuming that printer will respond to cmds in order... uhh
        handler = commandHandlers[command] // will be called by client.on('data'), above
        console.log(`Zebra driver writing ${command}...`)
        //. do try/catch - handle disconnection, reconnection
        client.write(command + '\r\n')
        // give printer a little time to respond
        await new Promise(resolve => setTimeout(resolve, messagePauseTime))

        //. make sure all is in consistent state here
        // get errors and warnings as one string
        const errorMsgs = errors.map(error => `ERROR: ${error}`)
        const warningMsgs = warnings.map(warning => `WARNING: ${warning}`)
        const msgs = [...errorMsgs, ...warningMsgs].join(', ') || 'UNAVAILABLE'
        setCache('msg', msgs)
        // set condition and state
        if (errors.length > 0) {
          setCache('cond', 'FAULT')
          setCache('state', 'INTERRUPTED') // execution state - see also HS handler
        } else if (warnings.length > 0) {
          setCache('cond', 'WARNING')
        } else {
          setCache('cond', 'NORMAL')
        }
      }
    }

    // set all cache keys to UNAVAILABLE
    function setAllUnavailable() {
      setCache('avail')
      setCache('emp') // power
      // call all the cmd handlers with no param -
      // each should clear the dataitems it handles
      const handlers = Object.values(commandHandlers)
      handlers.forEach(handler => handler())
    }

    // set a cache key to the given value, which will trigger shdr output
    function setCache(key, value = 'UNAVAILABLE') {
      cache.set(`${deviceId}-${key}`, value)
    }
  }
}
