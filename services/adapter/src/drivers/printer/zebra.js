// zebra printer driver

// this code handles these values -
// setCache triggers shdr output if value changed
// setCache('avail', 'AVAILABLE') // or UNAVAILABLE
// setCache('emp', 'ON') // or OFF
// setCache('state', 'ACTIVE') // or READY or WAIT
// setCache('cond', 'WARNING') // or NORMAL or ERROR
// setCache('msg', 'Some message')
// setCache('dark', 30) // -30 to +30 or sthing
// setCache('ht', 40) // head temp
// setCache('fr', 10) // feedrate - print speed
// setCache('tl', 100) // total length - odometer
// setCache('uc', 3) // unload count = total lifetime label count

import net from 'net' // node lib for tcp - https://nodejs.org/api/net.html
import * as parsers from './zebra-parsers.js'
import * as lib from '../../common/lib.js'

// want this low as possible - see below comment
const pollInterval = 3000 // ms

// each command needs some time to wait for printer to respond
// and currently we have 4 commands, so this times that is total time to
// loop through all commands. keep it under the pollInterval.
const messagePauseTime = 500 // ms

export class AdapterDriver {
  //
  //. use connect obj
  start({ device, host, port, cache }) {
    console.log(`Zebra start driver...`)

    let client // tcp connection
    let handler // current message handler
    let errors // set of error message strings, eg set{'Paper Out'}
    let warnings // set of warning message strings, eg set{'Ribbon Low'}

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
        console.log(`Zebra sleeping - will try to connect again...`)
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
          setCache('labels_remaining', ret.labelsRemaining)

          // handle errors and warnings
          // if (ret.errors) errors.push(...ret.errors)
          // if (ret.warnings) warnings.push(...ret.warnings)
          ret.errors.forEach(error => errors.add(error))
          ret.warnings.forEach(warning => warnings.add(warning))

          // execution state MUST be READY, ACTIVE, INTERRUPTED, WAIT,
          // FEED_HOLD, STOPPED, OPTIONAL_STOP, PROGRAM_STOPPED,
          // or PROGRAM_COMPLETED.
          // we'll use
          //   INTERRUPTED - if any error condition
          //   ACTIVE - if labelsRemaining > 0
          //   READY - otherwise

          // note: poll() fn will overwrite this with INTERRUPTED if any additional
          // errors found with ~HQES handler.
          const state =
            errors.length > 0
              ? 'INTERRUPTED'
              : ret.labelsRemaining > 0
              ? 'ACTIVE'
              : 'READY'
          setCache('state', state)

          // write message string if any
          handleMessages()
        } else {
          setCache('state')
          setCache('labels_remaining')
        }
      },

      // host query status - errors and warnings - see guide p205.
      // not all printers handle this, or return all 0's (no errors/warnings).
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
          // if (ret.errors) errors.push(...ret.errors)
          // if (ret.warnings) warnings.push(...ret.warnings)
          ret.errors.forEach(error => errors.add(error))
          ret.warnings.forEach(warning => warnings.add(warning))

          // write message string if any
          handleMessages()

          // make sure state is consistent
          if (errors.length > 0) {
            setCache('state', 'INTERRUPTED')
          }
        }
      },

      // head diagnostic - get head temp, darkness adjust (?) - p199.
      // note: this clears the cache values if response is null/undefined.
      '~HD': response => {
        const ret = response ? parsers.parseHD(response) : {}
        setCache('ht', ret['Head Temp']) // Celsius
        setCache('dark', ret['Darkness Adjust']) // -30 to +30 or sthing
        setCache('fr', ret['Print Speed']) // feed rate - inches/sec
      },

      // host query odometer - nonresettable and user resettable 1 and 2.
      // note: this clears the cache values if response is null/undefined.
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
      const response = data.toString() // eg 'PRINTER STATUS ERRORS: 1 00000000 00000005 WARNINGS: 1 00000000 00000002' // zpl returns
      console.log(`Zebra driver received response:\n`, response)
      //. make sure that we're handling the right command somehow
      // eg set another var for current cmd being processed?
      if (handler) {
        // use try catch block to catch any errors due to wrong cmd being handled,
        // eg if printer is slow to respond to a command.
        try {
          handler(response)
        } catch (error) {
          // bug - this was causing cycling avail/unavail every 500ms - bad
          //. work out a better timeout handling response for commands -
          // ie wait before sending next command
          // setAllUnavailable()
        }
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
      // clear lists
      errors = []
      warnings = []
      // iterate over cmds, set handler temporarily
      const commands = Object.keys(commandHandlers)
      for (let command of commands) {
        //. this is assuming that printer will respond to cmds in order... uhh
        handler = commandHandlers[command] // will be called by client.on('data'), above
        console.log(`Zebra driver writing ${command}...`)
        //. handle disconnection, reconnection? or just keep calling client.write?
        try {
          client.write(command + '\r\n')
        } catch (error) {
          console.log('Zebra - caught exception on client.write call')
          console.log(error)
        }
        // give printer a little time to respond
        await new Promise(resolve => setTimeout(resolve, messagePauseTime))
      }
    }

    // handle errors and warnings -> msg, cond, state
    function handleMessages() {
      // get errors and warnings as one string
      const errorMsgs = [...errors].map(error => `ERROR: ${error}`)
      const warningMsgs = [...warnings].map(warning => `WARNING: ${warning}`)
      const msgs = [...errorMsgs, ...warningMsgs].join(', ') || 'OKAY'
      setCache('msg', msgs)

      // set condition and state
      //. pass all errors/warnings here - see https://github.com/Ladder99/ladder99-ce/issues/130
      if (errors.length > 0) {
        setCache('cond', 'FAULT')
        setCache('state', 'INTERRUPTED') // execution state - see also HS handler
      } else if (warnings.length > 0) {
        setCache('cond', 'WARNING')
      } else {
        setCache('cond', 'NORMAL')
      }
    }

    // set all cache keys to UNAVAILABLE
    function setAllUnavailable() {
      setCache('avail')
      setCache('emp') // power
      setCache('msg')
      // call all the cmd handlers with no param -
      // each should clear the dataitems it handles
      const handlers = Object.values(commandHandlers)
      handlers.forEach(handler => handler())
    }

    // set a cache key to the given value, which will trigger shdr output
    function setCache(key, value = 'UNAVAILABLE') {
      cache.set(`${device.id}-${key}`, value)
    }
  }
}
