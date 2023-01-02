// simulate some modbus counters

import ModbusRTU from 'modbus-serial' // see https://github.com/yaacov/node-modbus-serial

// const mbHost = 'simulator'
// const mbHost = 'host.docker.internal' // access host from docker container
// const mbHost = 'localhost'
const mbHost = '0.0.0.0'
const mbPort = 502
const mbId = 1

export class Simulator {
  //
  async start() {
    console.log('Modbus start')

    const vector = {
      getInputRegister: function (addr, unitID) {
        // Synchronous handling
        return addr
      },
      // callback is function(err, value)
      getHoldingRegister: function (addr, unitID, callback) {
        // handle uint32be
        if (addr === 5000) {
          callback(null, totalCount) //. this seems to only handle 16bit values, so changed setup.yaml to uint16be
        } else if (addr === 5008) {
          callback(null, goodCount) //. this seems to only handle 16bit values, so changed setup.yaml to uint16be
        } else if (addr === 5016) {
          callback(null, badCount) //. this seems to only handle 16bit values, so changed setup.yaml to uint16be
        } else if (addr === 5024) {
          callback(null, rejectCount) //. this seems to only handle 16bit values, so changed setup.yaml to uint16be
        } else {
          callback(null, 0)
        }
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

    // update counts randomly, which are 'published' above
    let totalCount = 0
    let goodCount = 0
    let badCount = 0
    let rejectCount = 0
    const counterMax = 9999
    setInterval(() => {
      // const delta = Math.floor(Math.random() * 3) // some random number of parts have passed by
      const delta = 4
      totalCount += delta
      // const rejectDelta = Math.random() > 0.9 ? 1 : 0
      const rejectDelta = 0
      // const badDelta = Math.floor(Math.random() * delta)
      const badDelta = 1
      badCount += badDelta
      goodCount += delta - badDelta
      rejectCount += rejectDelta //. does this add into totalCount also?
      if (totalCount > counterMax) {
        totalCount = 0
        goodCount = 0
        badCount = 0
        rejectCount = 0
      }
      console.log('Modbus counts', totalCount, goodCount, badCount, rejectCount)
    }, 1000)
  }
}
