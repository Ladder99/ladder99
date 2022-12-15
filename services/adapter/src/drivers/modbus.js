// modbus driver

// state machine skeleton borrowed from
// https://github.com/yaacov/node-modbus-serial/blob/master/examples/polling_TCP.js

//. handle disconnect, interrupt (sigint etc), reconnect, errors, polling
//. handle different polling intervals for different addresses? use timers?
//. handle stop method

import ModbusRTU from 'modbus-serial' // see https://github.com/yaacov/node-modbus-serial

// Modbus state constants
const STATE_INIT = 1
const STATE_IDLE = 2
const STATE_NEXT = 3
const STATE_GOOD_READ = 4
const STATE_FAIL_READ = 5
const STATE_GOOD_CONNECT = 6
const STATE_FAIL_CONNECT = 7

// Modbus TCP configuration values
const mbId = 1 //. ?
const mbPollingInterval = 1000
const mbTimeout = 1000

export class AdapterDriver {
  //
  async start({ device, cache, source, schema }) {
    //
    console.log('Modbus start', device.id, device.name, source.schema)

    const mbHost = source?.connect?.host
    const mbPort = source?.connect?.port ?? 502

    // get array of inputs { key, address, count } - eg { key: 'pcgood', address: 5008, count: 2 }
    const inputs = schema?.inputs?.inputs ?? []
    console.log('Modbus inputs', inputs)

    // create modbus client
    const client = new ModbusRTU()

    // set request parameters
    client.setID(mbId)
    client.setTimeout(mbTimeout) // default is null (no timeout)

    // start state machine
    let mbStatus = 'Modbus initializing...'
    let mbState = STATE_INIT
    await runStateMachine()

    // define functions here so they can access variables in scope

    async function runStateMachine() {
      let nextAction

      while (true) {
        console.log('Modbus state', mbState)
        switch (mbState) {
          case STATE_INIT:
            nextAction = connectClient
            break

          case STATE_NEXT:
            nextAction = readData
            break

          case STATE_GOOD_CONNECT:
            nextAction = readData
            break

          case STATE_FAIL_CONNECT:
            nextAction = connectClient
            break

          case STATE_GOOD_READ:
            nextAction = readData
            break

          case STATE_FAIL_READ:
            if (client.isOpen) {
              mbState = STATE_NEXT
            } else {
              nextAction = connectClient
            }
            break

          default:
          // nothing to do, keep polling until actionable case
        }

        // execute "next action" function, if defined
        if (nextAction !== undefined) {
          console.log(`Modbus running`, nextAction.name)
          nextAction() // execute function - this sets mbState, mbStatus
          mbState = STATE_IDLE
        }

        // wait before connecting or polling again
        await new Promise(resolve => setTimeout(resolve, mbPollingInterval)) // ms
      }
    }

    function connectClient() {
      // close port (NOTE: important in order not to create multiple connections)
      if (mbState !== STATE_INIT) {
        client.close()
      }

      console.log(`Modbus connecting to ${mbHost}:${mbPort}...`)
      client
        .connectTCP(mbHost, { port: mbPort })
        .then(() => {
          mbState = STATE_GOOD_CONNECT
          mbStatus = 'Modbus connect success'
          console.log(mbStatus)
          setValue('avail', 'AVAILABLE') // connected successfully
        })
        .catch(error => {
          mbState = STATE_FAIL_CONNECT
          mbStatus = 'Modbus connect error ' + error.message
          console.log(mbStatus)
          setValue('avail', 'UNAVAILABLE') //. set other dataitems also?
        })
    }

    function readData() {
      for (let input of inputs) {
        // extract input properties, with default values
        // eg { key: 'l1-pcall', address: 5000, type: 'holding', datatype: 'uint32' }
        const { key, address, type = 'holding', datatype = 'uint16' } = input
        if (type === 'holding') {
          const count = datatype === 'uint32' ? 2 : 1
          client
            .readHoldingRegisters(address, count)
            .then(data => {
              mbState = STATE_GOOD_READ
              mbStatus = `Modbus read ${address} success`
              const value = datatype === 'uint32'
                ? +data.buffer.readUInt32BE(0).toString()
                // FIXME: What is the type of `status`, `fault`, `warn`, `nlanes`? Chris says `16-bit WORD`. `data.buffer.toString()` does not work (obviously).
                : data.buffer.toString()

              console.log('Modbus value', value)
              setValue(key, value)
            })
            .catch(error => {
              mbState = STATE_FAIL_READ
              mbStatus = `Modbus read ${address} error ` + error.message
              console.log(mbStatus)
            })
        }
      }
    }

    // update cache, which will publish shdr on change
    function setValue(key, value) {
      const id = device.id + '-' + key
      cache.set(id, value)
    }
  }

  //. implement this for graceful shutdown - but need the adapter infrastructure for it also
  stop() {
    console.log('Modbus stop')
  }
}
