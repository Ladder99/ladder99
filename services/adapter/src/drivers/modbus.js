// modbus driver

// state machine skeleton borrowed from
// https://github.com/yaacov/node-modbus-serial/blob/master/examples/polling_TCP.js

import ModbusRTU from 'modbus-serial' // see https://github.com/yaacov/node-modbus-serial

// Modbus state constants
const STATE_INIT = 'State init'
const STATE_IDLE = 'State idle'
const STATE_NEXT = 'State next' //. ?
const STATE_GOOD_READ = 'State good (read)'
const STATE_FAIL_READ = 'State fail (read)'
const STATE_GOOD_CONNECT = 'State good (port)'
const STATE_FAIL_CONNECT = 'State fail (port)'

// Modbus TCP configuration values
const mbId = 1 //. ?
const mbPollingInterval = 1000
const mbTimeout = 5000

export class AdapterDriver {
  //
  async start({ device, cache, source, schema }) {
    //
    console.log('Modbus start', device.id)

    const mbHost = source?.connect?.host
    const mbPort = source?.connect?.port ?? 502

    // // get array of { key, address, count } - eg { key: 'pcgood', address: 5008, count: 2 }
    // const inputs = schema?.inputs?.inputs ?? []
    // console.log('Modbus inputs', inputs)

    // create modbus client
    const client = new ModbusRTU()

    let mbStatus = 'Initializing...'
    let mbState = STATE_INIT

    // start state machine
    // handle disconnect, reconnect, errors, polling
    await runStateMachine()

    // define functions here so they can access variables in scope

    async function runStateMachine() {
      let nextAction

      while (true) {
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

        console.log()
        console.log(nextAction)

        // execute "next action" function, if defined
        if (nextAction !== undefined) {
          nextAction()
          mbState = STATE_IDLE
        }

        // wait a bit before polling again
        await new Promise(resolve => setTimeout(resolve, mbPollingInterval)) // ms
      }
    }

    // try to connect to server
    function connectClient() {
      // close port (NOTE: important in order not to create multiple connections)
      if (mbState !== STATE_INIT) {
        client.close()
      }

      // set request parameters
      client.setID(mbId)
      client.setTimeout(mbTimeout) // default is null (no timeout)

      // try to connect
      client
        .connectTCP(mbHost, { port: mbPort })
        .then(function () {
          mbState = STATE_GOOD_CONNECT
          mbStatus = 'Connected, wait for reading...'
          console.log(mbStatus)
          setValue('avail', 'AVAILABLE') // connected successfully
        })
        .catch(function (e) {
          mbState = STATE_FAIL_CONNECT
          mbStatus = e.message
          console.log(e)
        })
    }

    // try to read data
    function readData() {
      client
        .readHoldingRegisters(0, 10) //.
        .then(function (data) {
          mbState = STATE_GOOD_READ
          mbStatus = 'success'
          console.log(data.buffer)
        })
        .catch(function (e) {
          mbState = STATE_FAIL_READ
          mbStatus = e.message
          console.log(e)
        })
    }

    // update cache, which will publish shdr on change
    function setValue(key, value) {
      const id = device.id + '-' + key
      cache.set(id, value)
    }
  }
}
