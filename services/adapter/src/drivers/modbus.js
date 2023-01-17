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
const mbId = 1
const mbPollingInterval = 1000
const mbTimeout = 4000

// number of registers to read for diff datatypes
const datatypeCounts = {
  uint16be: 1,
  int16be: 1,
  uint32be: 2,
  int32be: 2,
  uint16le: 1,
  int16le: 1,
  uint32le: 2,
  int32le: 2,
  floatbe: 2,
  floatle: 2,
  doublebe: 4,
  doublele: 4,
}

// Buffer methods to use for diff datatypes
// in node,
// Buffer.from([1,2]) // <Buffer 01 02>
// Buffer.from([1,2]).readUInt16BE(0) // 258
// Buffer.from([1,2]).readUInt16BE(0).toString() // '258'
// Buffer.from([1,2])['readUInt16BE'](0) // 258
const datatypeMethods = {
  uint32be: 'readUInt32BE',
  uint16be: 'readUInt16BE',
  int16be: 'readInt16BE',
  int32be: 'readInt32BE',
  uint32le: 'readUInt32LE',
  uint16le: 'readUInt16LE',
  int16le: 'readInt16LE',
  int32le: 'readInt32LE',
  floatbe: 'readFloatBE',
  floatle: 'readFloatLE',
  doublebe: 'readDoubleBE',
  doublele: 'readDoubleLE',
}

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
          // console.log(`Modbus running`, nextAction.name)
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
        // eg { key: 'l1-pcall', address: 5000, type: 'holding', datatype: 'uint32be' }
        const { key, address, type = 'holding', datatype = 'uint16be' } = input
        // console.log(`Modbus reading ${key} ${address} ${type} ${datatype}...`)
        if (type === 'holding') {
          const count = datatypeCounts[datatype] // eg 2 for 'uint32be'
          client
            .readHoldingRegisters(address, count)
            .then(data => {
              mbState = STATE_GOOD_READ
              mbStatus = `Modbus read ${address} success`
              // console.log(mbStatus, data.buffer)
              const method = datatypeMethods[datatype] // eg 'readUInt32BE' for 'uint32be'
              const value = data.buffer[method](0) // eg data.buffer.readUInt32BE(0)
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
