// microcontroller driver
// fetches data from microcontroller/pc etc
// see modules/micro folder.

// this library causes highcpu on windows - 2022-02
// https://github.com/sebhildebrandt/systeminformation/issues/626
// best for now is to not include the micro driver in the client setup on windows.
// seems to be fixed, or works from git bash - 2022-09-26.
import si from 'systeminformation' // see https://github.com/sebhildebrandt/systeminformation

import * as lib from '../common/lib.js' // for lib.rounded

const pollInterval = 5000 // msec //. could get from setup

export class AdapterDriver {
  init({ device, cache }) {
    console.log(`Micro - initialize driver...`)

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
          fsSize: 'fs, size, used, use, available', // gives an array
          osInfo: 'platform, distro, release, codename, arch, hostname',
        }

        // read the specs data
        const data = await si.get(specs)
        // console.log(data) // too much info

        // get total disk space as { size, used, use }
        // console.log('Micro fsSize', data.fsSize)
        // console.log(data.fsSize.map(d => d.fs))
        // data.fsSize is sthing like this - reduce to single object - or just use drvfs?
        // windows:
        // [
        //   { fs: 'overlay', size: 269490393088, used: 26778972160, use: 10.47 },
        //   { fs: 'drvfs', size: 489472126976, used: 420276023296, use: 85.86 },
        //   { fs: '/dev/sdc', size: 269490393088, used: 26778972160, use: 10.47 }
        // ]
        // linux: pi just has overlay
        //
        // const disk = data.fsSize.reduce(
        //   (acc, fs) => {
        //     acc.size += fs.size
        //     acc.used += fs.used
        //     acc.available += fs.available
        //     return acc
        //   },
        //   { size: 0, used: 0, available: 0 }
        // )
        // disk.use = (disk.used / (disk.size || 1)) * 100
        // const disk = data.fsSize.find(o => o.fs === 'drvfs') || {}
        const disk = data.fsSize.find(o => o.fs === 'overlay') || {}

        // write values to cache
        setValue('availability', 'AVAILABLE')
        setValue('condition', 'NORMAL')
        setValue('temperature', lib.rounded(data.cpuTemperature.main, 1))
        setValue('memory-total', lib.rounded(data.mem.total, -6))
        setValue('memory-free', lib.rounded(data.mem.free, -6))
        setValue('memory-used', lib.rounded(data.mem.used, -6))
        setValue('cpu-total', lib.rounded(data.currentLoad.currentLoad, 1))
        setValue('cpu-user', lib.rounded(data.currentLoad.currentLoadUser, 1))
        setValue(
          'cpu-system',
          lib.rounded(data.currentLoad.currentLoadSystem, 1)
        )
        setValue('disk-size', disk.size) // bytes
        setValue('disk-used', lib.rounded(disk.used, -6)) // bytes rounded to mb
        setValue('disk-use', lib.rounded(disk.use, 0)) // percent
        setValue('disk-available', lib.rounded(disk.available, -6)) // bytes rounded to mb
        setValue('os', getDataSet(data.osInfo))
        //
      } catch (error) {
        console.log(error.message)
        setUnavailable()
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
      setValue('disk-available', 'UNAVAILABLE')
      setValue('os', 'UNAVAILABLE')
    }

    function setValue(name, value) {
      cache.set(`${device.id}-${name}`, value, { quiet: true })
    }
  }
}

// get object in DATA_SET format for shdr,
// will return something like "free=48237472 used=12387743 total=38828348"
//. this should be part of cache.js
function getDataSet(obj) {
  // sanitize the keys as well as the values
  const str = Object.keys(obj)
    .map(key => `${sanitize(key)}=${sanitize(obj[key])}`)
    .join(' ')
  return str
  function sanitize(value) {
    return String(value || '')
      .replaceAll(' ', '_')
      .replaceAll('\n', ' ')
      .replaceAll('|', '-')
      .replaceAll('=', '-')
  }
}
