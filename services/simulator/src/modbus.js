// simulate some modbus counters

import ModbusRTU from 'modbus-serial' // see https://github.com/yaacov/node-modbus-serial

// const mbHost = 'simulator'
// const mbHost = 'host.docker.internal' // access host from docker container
// const mbHost = 'localhost'
const mbHost = '0.0.0.0'
const mbPort = 502
const mbId = 1

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

    // define constants
    const status = 1
    const fault = 100
    const warn = 100
    const nlanes = 1
    // const rollover = 100
    const rollover = 1e7

    // define counters
    let totalCount = 0
    let goodCount = 0
    let badCount = 0
    let rejectCount = 0

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
          5000: totalCount,
          5008: goodCount,
          5016: badCount,
          5024: rejectCount,
          // 5064: rollover,
          5064: lower(rollover),
          5066: upper(rollover),
        }
        const value = lookup[addr]
        if (value === undefined) {
          callback(new Error('Invalid register address'), null)
        } else {
          callback(null, value) //. this seems to only handle 16bit values, so changed setup.yaml to uint16be
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
    setInterval(() => {
      // const delta = Math.floor(Math.random() * 3) // some random number of parts have passed by
      const delta = 3
      totalCount += delta
      // const rejectDelta = Math.random() > 0.9 ? 1 : 0
      // const badDelta = Math.floor(Math.random() * delta)
      const rejectDelta = 0
      const badDelta = 1
      badCount += badDelta
      goodCount += delta - badDelta
      rejectCount += rejectDelta //. does this add into totalCount also?

      //. assume these all rollover?
      if (totalCount >= rollover) {
        totalCount -= rollover
        goodCount = 0
        badCount = 0
        rejectCount = 0
      }
      console.log('Modbus counts', totalCount, goodCount, badCount, rejectCount)
    }, 1000)
  }
}
