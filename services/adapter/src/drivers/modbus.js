// modbus driver

// state machine skeleton borrowed from
// https://github.com/yaacov/node-modbus-serial/blob/master/examples/polling_TCP.js

import ModbusRTU from 'modbus-serial' // see https://github.com/yaacov/node-modbus-serial

// Modbus 'state' constants
const MBS_STATE_INIT = 'State init'
const MBS_STATE_IDLE = 'State idle'
const MBS_STATE_NEXT = 'State next'
const MBS_STATE_GOOD_READ = 'State good (read)'
const MBS_STATE_FAIL_READ = 'State fail (read)'
const MBS_STATE_GOOD_CONNECT = 'State good (port)'
const MBS_STATE_FAIL_CONNECT = 'State fail (port)'

// Modbus TCP configuration values
const mbsId = 1
const mbsScan = 1000
const mbsTimeout = 5000

export class AdapterDriver {
  //
  start({ device, cache, source, schema }) {
    //
    console.log('Modbus start', device.id)

    this.device = device
    this.cache = cache
    this.source = source
    this.schema = schema

    this.host = source?.connect?.host
    this.port = source?.connect?.port ?? 502

    this.inputs = schema?.inputs?.inputs ?? [] // array of { key, address, count }
    console.log('Modbus inputs', this.inputs)

    //. start a state machine
    //. handle disconnect, reconnect, error, polling

    let mbsStatus = 'Initializing...' // holds a status of Modbus
    let mbsState = MBS_STATE_INIT

    function runModbus() {
      let nextAction

      switch (mbsState) {
        case MBS_STATE_INIT:
          nextAction = connectClient
          break

        case MBS_STATE_NEXT:
          nextAction = readModbusData
          break

        case MBS_STATE_GOOD_CONNECT:
          nextAction = readModbusData
          break

        case MBS_STATE_FAIL_CONNECT:
          nextAction = connectClient
          break

        case MBS_STATE_GOOD_READ:
          nextAction = readModbusData
          break

        case MBS_STATE_FAIL_READ:
          if (client.isOpen) {
            mbsState = MBS_STATE_NEXT
          } else {
            nextAction = connectClient
          }
          break

        default:
        // nothing to do, keep scanning until actionable case
      }

      console.log()
      console.log(nextAction)

      // execute "next action" function if defined
      if (nextAction !== undefined) {
        nextAction()
        mbsState = MBS_STATE_IDLE
      }

      // set for next run
      //. this is a polling loop, but do differently?
      setTimeout(runModbus, mbsScan)
    }

    // this.setValue('avail', 'AVAILABLE') // connected successfully

    function connectClient() {
      // close port (NOTE: important in order not to create multiple connections)
      client.close()

      // set requests parameters
      client.setID(mbsId)
      client.setTimeout(mbsTimeout) // default is null (no timeout)

      // try to connect
      client
        .connectTCP(mbsHost, { port: mbsPort })
        .then(function () {
          mbsState = MBS_STATE_GOOD_CONNECT
          mbsStatus = 'Connected, wait for reading...'
          console.log(mbsStatus)
        })
        .catch(function (e) {
          mbsState = MBS_STATE_FAIL_CONNECT
          mbsStatus = e.message
          console.log(e)
        })
    }

    function readModbusData() {
      // try to read data
      client
        .readHoldingRegisters(0, 18) //.
        .then(function (data) {
          mbsState = MBS_STATE_GOOD_READ
          mbsStatus = 'success'
          console.log(data.buffer)
        })
        .catch(function (e) {
          mbsState = MBS_STATE_FAIL_READ
          mbsStatus = e.message
          console.log(e)
        })
    }
  }

  // async getClient() {
  //   console.log(`Modbus connecting to`, this.host, this.port)
  //   return new Promise((resolve, reject) => {
  //     const client = new ModbusRTU()
  //     client
  //       .connectTCP(this.host, { port: this.port })
  //       .then(() => resolve(client))
  //       .catch(error => reject(error))
  //   })
  // }

  // async poll() {
  //   console.log('Modbus poll')
  //   for (let input of this.inputs) {
  //     const { key, address, count } = input
  //     const data = await this.getHoldingRegisters(address, count)
  //     console.log('Modbus values', data)
  //     const value = data[0] | (data[1] << 16)
  //     this.setValue(key, value)
  //   }
  // }

  // async getHoldingRegisters(address, count) {
  //   console.log(`Modbus read holding registers at ${address}, count ${count}`)
  //   return new Promise((resolve, reject) => {
  //     this.client
  //       .readHoldingRegisters(address, count)
  //       .then(response => resolve(response.data))
  //       .catch(error => reject(error))
  //   })
  // }

  // helper methods

  setValue(key, value) {
    const id = this.device.id + '-' + key
    this.cache.set(id, value)
  }
}
