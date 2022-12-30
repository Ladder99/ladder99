// simulate some modbus counters

import ModbusRTU from 'modbus-serial' // see https://github.com/yaacov/node-modbus-serial

const mbHost = 'localhost'
const mbPort = 502
const mbId = 1 //. ?
const mbTimeout = 1000

export class Simulator {
  //
  async start() {
    console.log('Modbus start', url)

    const client = new ModbusRTU()

    // set request parameters
    client.setID(mbId)
    client.setTimeout(mbTimeout) // default is null (no timeout)

    let counter = 0
    const counterMax = 100

    console.log(`Modbus connecting to ${mbHost}:${mbPort}...`)
    client
      .connectTCP(mbHost, { port: mbPort })
      .then(() => {
        console.log('Modbus connect success')
        // loop and publish incrementing and looping counter
        setInterval(() => {
          const delta = Math.floor(Math.random() * 2)
          counter += delta
          if (counter > counterMax) counter = 0 // loop around
          console.log('Modbus write', counter)
          client.writeRegister(5000, counter) //.
        }, 1000)
      })
      .catch(error => {
        console.log('Modbus connect error ' + error.message)
      })
  }
}
