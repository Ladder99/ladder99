// simulate some modbus counters

import ModbusRTU from 'modbus-serial' // see https://github.com/yaacov/node-modbus-serial

// const mbHost = 'simulator'
// const mbHost = 'host.docker.internal' // access host from docker container
// const mbHost = 'localhost'
const mbHost = '0.0.0.0'

const mbPort = 502
const mbId = 1

// constants
const timeDelta = 1000 // msec between updates
const totalDelta = 4 // so in each minute, totalCount should increase by 240 - which should give a Performance value of 240/200=120%
const badDelta = 1 // and badCount by 60, and goodCount by 180
const rollover = 1e7
const nlanes = 1
const changeRate = 0.01 // chance of change
const rejectRate = 0.02 // chance of reject

function lower(value) {
  return value & 0xffff
}
function upper(value) {
  return (value >> 16) & 0xffff
}

export class Simulator {
  //
  async start() {
    console.log('Modbus start')

    // define values
    let totalCount = 0
    let goodCount = 0
    let badCount = 0
    let rejectCount = 0
    let status = 1
    let fault = 0
    let warn = 0

    // define get/update fns
    const vector = {
      getInputRegister: function (addr, unitID) {
        return addr
      },
      // callback is function(err, value)
      getHoldingRegister: function (addr, unitID, callback) {
        //. handle uint32be - split into two callbacks?
        const lookup = {
          2100: status,
          2101: fault,
          2102: warn,
          3000: nlanes,
          5000: upper(totalCount),
          5001: lower(totalCount),
          5008: upper(goodCount),
          5009: lower(goodCount),
          5016: upper(badCount),
          5017: lower(badCount),
          5024: upper(rejectCount),
          5025: lower(rejectCount),
          5064: upper(rollover),
          5065: lower(rollover),
        }
        const value = lookup[addr]
        console.log('get register', addr, '=', value)
        if (value === undefined) {
          callback(new Error('Invalid register address'), null)
        } else {
          callback(null, value)
        }
      },
      getCoil: function (addr, unitID) {
        return new Promise(function (resolve) {
          setTimeout(function () {
            resolve(addr % 2 === 0)
          }, 10)
        })
      },
      setRegister: function (addr, value, unitID) {
        console.log('set register', addr, value, unitID)
        return
      },
      setCoil: function (addr, value, unitID) {
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

    // create modbus server
    const serverTCP = new ModbusRTU.ServerTCP(vector, {
      host: mbHost,
      port: mbPort,
      unitID: mbId,
      debug: true,
    })

    // handle errors
    serverTCP.on('socketError', function (err) {
      // Handle socket error if needed, can be ignored
      console.log(err)
    })

    // update values, which are 'published' above in the vector fns
    setInterval(() => {
      //
      // update counters
      totalCount += totalDelta
      badCount += badDelta
      goodCount += totalDelta - badDelta
      const rejectDelta = Math.random() < rejectRate ? 1 : 0
      rejectCount += rejectDelta //. does this add into totalCount also?

      // reset counts when totalCount rolls over
      if (totalCount >= rollover) {
        totalCount -= rollover
        goodCount = 0
        badCount = 0
        rejectCount = 0
      }
      console.log('Modbus counts', totalCount, goodCount, badCount, rejectCount)

      // update other values
      status =
        Math.random() < changeRate ? Math.floor(Math.random() * 4) : status // 0 to 3
      fault = Math.random() < changeRate ? Math.floor(Math.random() * 5) : fault
      warn = Math.random() < changeRate ? Math.floor(Math.random() * 5) : warn
      console.log('Modbus status, fault, warn', status, fault, warn)
      //
    }, timeDelta)
  }
}
