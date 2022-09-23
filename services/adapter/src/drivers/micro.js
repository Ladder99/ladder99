// microcontroller driver
// fetches data from microcontroller/pc etc
// see modules/micro folder.

//. this library causes highcpu on windows - 2022-02
// https://github.com/sebhildebrandt/systeminformation/issues/626
// best for now is to not include the micro driver in the client setup on windows.
import si from 'systeminformation' // see https://github.com/sebhildebrandt/systeminformation

const pollInterval = 5000 // msec //. get from setup

export class AdapterDriver {
  init({ device, cache }) {
    console.log(`Initialize microcontroller driver...`)

    setUnavailable()
    setInterval(readData, pollInterval)

    async function readData() {
      try {
        // get specs object like { mem: 'total, free, used' }, as expected by si module
        // const specs = {}
        // inputs.inputs.forEach(input => (specs[input.item] = input.subitems))

        // most interesting ones avail ---
        // battery: hasBattery, currentCapacity, maxCapacity, capacityUnit, percent mWh
        // cpu: manufacturer, brand, speed, cores
        // cpuTemperature: main, cores
        // currentLoad: currentLoad, currentLoadUser, currentLoadSystem
        // disksIO: rIO, wIO
        // dockerContainers: name, createdAt, state
        // fsSize: fs, type, size, available
        // mem: total, free, used
        // osInfo: platform, distro, release, codename, arch, hostname
        // wifiInterfaces: id, model, vendor
        const specs = {
          cpuTemperature: 'main',
          mem: 'total, free, used',
          currentLoad: 'currentLoad, currentLoadUser, currentLoadSystem',
          fsSize: 'fs, size, used, use', // [ { fs: '/', size: 100, used: 20, use: 5.0 }, ... ]
          osInfo: 'platform, distro, release, codename, arch, hostname',
        }

        // read the specs data
        const data = await si.get(specs)
        // console.log(data) // too much info

        // get total disk space as { size, used, use }
        // data.fsSize is sthing like this - reduce to single object - or just use drvfs?
        // [
        //   { fs: 'overlay', size: 269490393088, used: 26778972160, use: 10.47 },
        //   { fs: 'drvfs', size: 489472126976, used: 420276023296, use: 85.86 },
        //   { fs: '/dev/sdc', size: 269490393088, used: 26778972160, use: 10.47 }
        // ]
        // const disk = data.fsSize.reduce(
        //   (acc, fs) => {
        //     acc.size += fs.size
        //     acc.used += fs.used
        //     return acc
        //   },
        //   { size: 0, used: 0 }
        // )
        // disk.use = (disk.used / (disk.size || 1)) * 100
        const disk = data.fsSize.find(fs => fs.fs === 'drvfs') || {}

        // write values to cache
        setValue('availability', 'AVAILABLE')
        setValue('condition', 'NORMAL')
        setValue('temperature', rounded(data.cpuTemperature.main, 1))
        setValue('memory-total', rounded(data.mem.total, -6))
        setValue('memory-free', rounded(data.mem.free, -6))
        setValue('memory-used', rounded(data.mem.used, -6))
        setValue('cpu-total', rounded(data.currentLoad.currentLoad, 1))
        setValue('cpu-user', rounded(data.currentLoad.currentLoadUser, 1))
        setValue('cpu-system', rounded(data.currentLoad.currentLoadSystem, 1))
        setValue('disk-size', disk.size)
        setValue('disk-used', rounded(disk.used, -4))
        setValue('disk-use', rounded(disk.use, 0))
        setValue('os', getDataSet(data.osInfo))
        //
      } catch (e) {
        setUnavailable()
        console.error(e)
      }
    }

    //. get this list from inputs also
    function setUnavailable() {
      setValue('availability', 'UNAVAILABLE')
      setValue('condition', 'UNAVAILABLE')
      setValue('temperature', 'UNAVAILABLE')
      setValue('memory-total', 'UNAVAILABLE')
      setValue('memory-free', 'UNAVAILABLE')
      setValue('memory-used', 'UNAVAILABLE')
      setValue('cpu-total', 'UNAVAILABLE')
      setValue('cpu-user', 'UNAVAILABLE')
      setValue('cpu-system', 'UNAVAILABLE')
      setValue('disk-size', 'UNAVAILABLE')
      setValue('disk-used', 'UNAVAILABLE')
      setValue('disk-use', 'UNAVAILABLE')
      setValue('os', 'UNAVAILABLE')
    }

    function setValue(name, value) {
      cache.set(`${device.id}-${name}`, value, { quiet: true })
    }
  }
}

// get object in DATA_SET format for shdr,
// eg "free=48237472 used=12387743 total=38828348"
//. this should be part of cache.js
function getDataSet(obj) {
  const regexp = new RegExp('[ ]')
  const str = Object.keys(obj)
    // .map(key => `${key}=${obj[key]}`)
    .map(key => {
      const value = String(obj[key] || '').replace(regexp, '_')
      return `${key}=${value}`
    })
    .join(' ')
  return str
}

//. to libjs
function rounded(value, decimals = 0) {
  if (value !== null && value !== undefined) {
    if (decimals < 0) {
      return Number(
        Math.round(value * Math.pow(10, decimals)) * Math.pow(10, -decimals)
      ).toFixed(0)
    }
    return Number(value).toFixed(decimals)
  }
  return null
}
