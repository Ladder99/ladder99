// modbus driver

// state machine skeleton borrowed from
// https://github.com/yaacov/node-modbus-serial/blob/master/examples/polling_TCP.js

import ModbusRTU from 'modbus-serial' // see https://github.com/yaacov/node-modbus-serial

// Modbus state constants
const STATE_INIT = 'State init'
const STATE_IDLE = 'State idle'
const STATE_NEXT = 'State next' //.?
const STATE_GOOD_READ = 'State good (read)'
const STATE_FAIL_READ = 'State fail (read)'
const STATE_GOOD_CONNECT = 'State good (port)'
const STATE_FAIL_CONNECT = 'State fail (port)'

// Modbus TCP configuration values
const mbId = 1
const mbPollingInterval = 1000
const mbTimeout = 5000

export class AdapterDriver {
  //
  async start({ device, cache, source, schema }) {
    //
    console.log('Modbus start', device.id)

    this.device = device
    this.cache = cache
    this.source = source
    this.schema = schema

    this.host = source?.connect?.host
    this.port = source?.connect?.port ?? 502

    // get array of { key, address, count } - eg { key: 'pcgood', address: 5008, count: 2 }
    this.inputs = schema?.inputs?.inputs ?? []
    console.log('Modbus inputs', this.inputs)

    // create modbus client
    const client = new ModbusRTU()

    // start state machine
    // handle disconnect, reconnect, error, polling
    let mbStatus = 'Initializing...'
    let mbState = STATE_INIT
    await runStateMachine()

    async function runStateMachine() {
      let nextAction

      while (true) {
        switch (mbState) {
          case STATE_INIT:
            nextAction = connectClient
            break

          case STATE_NEXT:
            nextAction = readModbusData
            break

          case STATE_GOOD_CONNECT:
            nextAction = readModbusData
            break

          case STATE_FAIL_CONNECT:
            nextAction = connectClient
            break

          case STATE_GOOD_READ:
            nextAction = readModbusData
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

    function connectClient() {
      // close port (NOTE: important in order not to create multiple connections)
      client.close()

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
          this.setValue('avail', 'AVAILABLE') // connected successfully
        })
        .catch(function (e) {
          mbState = STATE_FAIL_CONNECT
          mbStatus = e.message
          console.log(e)
        })
    }

    function readModbusData() {
      // try to read data
      client
        .readHoldingRegisters(0, 18) //.
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
  }

  // helper methods

  setValue(key, value) {
    const id = this.device.id + '-' + key
    this.cache.set(id, value)
  }
}
