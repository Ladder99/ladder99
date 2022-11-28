// modbus driver

// state machine skeleton borrowed from
// https://github.com/yaacov/node-modbus-serial/blob/master/examples/polling_TCP.js

//. handle disconnect, interrupt (sigint etc), reconnect, errors, polling
//. handle different polling intervals for different addresses?
//. handle stop method

import ModbusRTU from 'modbus-serial' // see https://github.com/yaacov/node-modbus-serial

// Modbus state constants
//. use ints
const STATE_INIT = 'Init'
const STATE_IDLE = 'Idle'
const STATE_NEXT = 'Next' //. ?
const STATE_GOOD_READ = 'Good (read)'
const STATE_FAIL_READ = 'Fail (read)'
const STATE_GOOD_CONNECT = 'Good (connect)'
const STATE_FAIL_CONNECT = 'Fail (connect)'

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
        console.log(`Modbus reading`, input)
        const { key, address, count } = input // eg { key: 'pcgood', address: 5008, count: 2 }
        client
          .readHoldingRegisters(address, count)
          .then(data => {
            mbState = STATE_GOOD_READ
            mbStatus = 'Modbus read success'
            const arr = [...data.buffer] // convert buffer to array
            console.log(mbStatus, arr)
            //. handle different data types, eg uint16, uint32, float etc
            setValue(key, arr[0]) // just use first value for now
          })
          .catch(error => {
            mbState = STATE_FAIL_READ
            mbStatus = 'Modbus read error ' + error.message
            console.log(mbStatus)
          })
      }
    }

    // update cache, which will publish shdr on change
    function setValue(key, value) {
      const id = device.id + '-' + key
      cache.set(id, value)
    }
  }

  stop() {
    console.log('Modbus stop')
  }
}
