// simulate some modbus counters

import ModbusRTU from 'modbus-serial' // see https://github.com/yaacov/node-modbus-serial

// const mbHost = 'simulator'
// const mbHost = 'host.docker.internal' // access host from docker container
// const mbHost = 'localhost'
const mbHost = '0.0.0.0'
const mbPort = 502
const mbId = 1 //. ?
const mbTimeout = 1000

export class Simulator {
  //
  async start() {
    console.log('Modbus start')

    // const client = new ModbusRTU()

    const vector = {
      getInputRegister: function (addr, unitID) {
        // Synchronous handling
        return addr
      },
      getHoldingRegister: function (addr, unitID, callback) {
        // Asynchronous handling (with callback)
        setTimeout(function () {
          // callback = function(err, value)
          callback(null, addr + 8000)
        }, 10)
      },
      getCoil: function (addr, unitID) {
        // Asynchronous handling (with Promises, async/await supported)
        return new Promise(function (resolve) {
          setTimeout(function () {
            resolve(addr % 2 === 0)
          }, 10)
        })
      },
      setRegister: function (addr, value, unitID) {
        // Asynchronous handling supported also here
        console.log('set register', addr, value, unitID)
        return
      },
      setCoil: function (addr, value, unitID) {
        // Asynchronous handling supported also here
        console.log('set coil', addr, value, unitID)
        return
      },
      readDeviceIdentification: function (addr) {
        return {
          0x00: 'MyVendorName',
          0x01: 'MyProductCode',
          0x02: 'MyMajorMinorRevision',
          0x05: 'MyModelName',
          0x97: 'MyExtendedObject1',
          0xab: 'MyExtendedObject2',
        }
      },
    }
    const serverTCP = new ModbusRTU.ServerTCP(vector, {
      host: mbHost,
      port: mbPort,
      unitID: mbId,
      debug: true,
    })

    serverTCP.on('socketError', function (err) {
      // Handle socket error if needed, can be ignored
      console.log(err)
    })

    // // set request parameters
    // client.setID(mbId)
    // client.setTimeout(mbTimeout) // default is null (no timeout)

    // let counter = 0
    // const counterMax = 100

    // let connected = false
    // while (!connected) {
    //   console.log(`Modbus connecting to ${mbHost}:${mbPort}...`)
    //   client
    //     .connectTCP(mbHost, { port: mbPort })
    //     .then(() => {
    //       console.log('Modbus connect success')
    //       // loop and publish incrementing and looping counter
    //       setInterval(() => {
    //         const delta = Math.floor(Math.random() * 2)
    //         counter += delta
    //         if (counter > counterMax) counter = 0 // loop around
    //         console.log('Modbus write', counter)
    //         client.writeRegister(5000, counter) //.
    //       }, 1000)
    //       connected = true
    //     })
    //     .catch(error => {
    //       console.log('Modbus connect error ' + error.message)
    //     })
    //   await new Promise(resolve => setTimeout(resolve, 1000))
    // }
  }
}
