// microcontroller driver
// fetches data from microcontroller/pc etc

import si from 'systeminformation'

const pollInterval = 2000 // msec
// const reconnectInterval = 5000 // msec

export class AdapterDriver {
  init({ deviceId, protocol, host, port, cache, inputs, socket }) {
    console.log(`Initialize microcontroller driver...`)

    setUnavailable()

    async function readData() {
      try {
        // const data = await si.cpu()
        // console.log('CPU Information:')
        // console.log('- manufucturer: ' + data.manufacturer)
        // console.log('- brand: ' + data.brand)
        // console.log('- speed: ' + data.speed)
        // console.log('- cores: ' + data.cores)
        // console.log('- physical cores: ' + data.physicalCores)

        // console.log(data)

        const data = await si.get({
          cpu: 'manufacturer, brand, speed, cores',
          cpuTemperature: 'main, cores',
          mem: 'total, free, used',
          battery:
            'hasBattery, currentCapacity, maxCapacity, capacityUnit, percent', // mWh
          osInfo: 'platform, distro, release, codename, arch, hostname',
          currentLoad: 'currentLoad, currentLoadUser, currentLoadSystem',
          disksIO: 'rIO, wIO',
          fsSize: 'fs, type, size, available',
          wifiInterfaces: 'id, model, vendor',
          dockerContainers: 'name, createdAt, state',
        })
        console.log(data)

        const str = JSON.stringify(data)
        cache.set(`${deviceId}-statistics`, { value: str })
        cache.set(`${deviceId}-temperature`, {
          value: data.cpuTemperature.main,
        })
        setAvailable()
      } catch (e) {
        // setUnavailable()
        console.error(e)
      }
    }

    setInterval(readData, pollInterval)

    // let reading = false
    // let timer = null

    // usb.on('attach', function (device) {
    //   console.log('Dymo M10 attached')
    //   setAvailable()
    //   timer = setInterval(startReading, pollInterval)
    // })

    // usb.on('detach', function (device) {
    //   if (
    //     device.deviceDescriptor.idVendor === vendorId &&
    //     device.deviceDescriptor.idProduct === productId
    //   ) {
    //     console.log('Dymo M10 detached')
    //     reading = false
    //     clearInterval(timer)
    //     timer = null
    //   }
    // })

    // function startReading() {
    //   if (reading) return
    //   try {
    //     const device = new HID.HID(vendorId, productId)

    //     console.log('Starting to read data from scale')
    //     reading = true

    //     device.on('data', function (data) {
    //       const buffer = Buffer.from(data)
    //       const mass = buffer[4] + 256 * buffer[5]

    //       let grams = 0
    //       if (buffer[2] === dataModeOunces) {
    //         const scalingFactor = Math.pow(10, data[3] - 256)
    //         const ounces = mass * scalingFactor
    //         grams = ounces * 0.035274
    //       } else if (buffer[2] === dataModeGrams) {
    //         // grams = mass
    //         grams = mass * 0.1 // chris says 10g was reporting as 0.1kg, so scale it
    //       }

    //       const kg = grams / 1000
    //       cache.set(`${deviceId}-mass`, { value: kg })
    //       setAvailable()
    //     })

    //     device.on('error', function (error) {
    //       setUnavailable()
    //       console.log(error)
    //       reading = false
    //       device.close()
    //     })
    //   } catch (err) {
    //     setUnavailable()
    //     if (/cannot open device/.test(err.message)) {
    //       console.log('Dymo M10 cannot be found')
    //     } else {
    //       console.log(err)
    //     }
    //   }
    // }

    function setAvailable() {
      cache.set(`${deviceId}-availability`, { value: 'AVAILABLE' })
    }

    function setUnavailable() {
      cache.set(`${deviceId}-availability`, { value: 'UNAVAILABLE' })
      cache.set(`${deviceId}-temperature`, { value: 'UNAVAILABLE' })
      cache.set(`${deviceId}-statistics`, { value: 'UNAVAILABLE' })
    }
  }
}
