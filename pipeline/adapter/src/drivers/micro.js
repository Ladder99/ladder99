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
        const data = await si.get({
          // cpu: 'manufacturer, brand, speed, cores',
          cpuTemperature: 'main, cores',
          mem: 'total, free, used',
          // battery:
          //   'hasBattery, currentCapacity, maxCapacity, capacityUnit, percent', // mWh
          // osInfo: 'platform, distro, release, codename, arch, hostname',
          // currentLoad: 'currentLoad, currentLoadUser, currentLoadSystem',
          // disksIO: 'rIO, wIO',
          // fsSize: 'fs, type, size, available',
          // wifiInterfaces: 'id, model, vendor',
          // dockerContainers: 'name, createdAt, state',
        })
        console.log(data)

        // get memory in DATA_SET format for shdr,
        // eg "free=48237472 used=12387743 total=38828348"
        const memstr = Object.keys(data.mem)
          .map(key => `${key}=${data.mem[key]}`)
          .join(' ')
        cache.set(`${deviceId}-memory`, { value: memstr })

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

    function setAvailable() {
      cache.set(`${deviceId}-availability`, { value: 'AVAILABLE' })
    }

    function setUnavailable() {
      cache.set(`${deviceId}-availability`, { value: 'UNAVAILABLE' })
      cache.set(`${deviceId}-memory`, { value: 'UNAVAILABLE' })
      cache.set(`${deviceId}-temperature`, { value: 'UNAVAILABLE' })
    }
  }
}
