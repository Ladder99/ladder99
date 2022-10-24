// host driver
// fetches systeminfo from host system
// see modules/host folder.

// this library causes highcpu on windows - 2022-02
// seems to be fixed, or at least works when run from git bash - 2022-09-26.
// see https://github.com/sebhildebrandt/systeminformation/issues/626
import si from 'systeminformation' // see https://github.com/sebhildebrandt/systeminformation

import * as lib from '../common/lib.js' // for lib.rounded

const pollInterval = 5000 // msec //. get from base setup

export class AdapterDriver {
  //
  start({ device, cache, module }) {
    //
    console.log(`Host start driver...`)
    this.device = device
    this.cache = cache
    this.module = module

    //. gather items by grouping items together

    // setUnavailable() //. do we need this? on agent disconnect, agent outputs unavailable.
    setInterval(this.poll.bind(this), pollInterval)
  }

  async poll() {
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
        currentLoad: 'currentLoad, currentLoadUser, currentLoadSystem',
        mem: 'total, free, used',
        fsSize: 'fs, size, used, use, available', // gives an array
        osInfo: 'platform, distro, release, codename, arch, hostname',
      }

      // read the specs data
      const data = await si.get(specs)
      // console.log(data) // too much info

      // get total disk space as { size, used, use }
      // console.log('Host fsSize', data.fsSize)
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
      setValue('avail', 'AVAILABLE')
      setValue('cond', 'NORMAL')
      setValue('temp', lib.rounded(data.cpuTemperature.main, 1))
      setValue('cputot', lib.rounded(data.currentLoad.currentLoad, 1))
      setValue('cpuuser', lib.rounded(data.currentLoad.currentLoadUser, 1))
      setValue('cpusys', lib.rounded(data.currentLoad.currentLoadSystem, 1))
      setValue('memtot', lib.rounded(data.mem.total, -6))
      setValue('memfree', lib.rounded(data.mem.free, -6))
      setValue('memused', lib.rounded(data.mem.used, -6))
      setValue('disksize', disk.size) // bytes
      setValue('diskused', lib.rounded(disk.used, -6)) // bytes rounded to mb
      setValue('diskuse', lib.rounded(disk.use, 0)) // percent
      setValue('diskavail', lib.rounded(disk.available, -6)) // bytes rounded to mb
      setValue('os', getDataSet(data.osInfo))
      //
    } catch (error) {
      console.log(error.message)
      setUnavailable()
    }
  }

  // //. get this list from inputs also
  // setUnavailable() {
  //   setValue('avail', 'UNAVAILABLE')
  //   setValue('cond', 'UNAVAILABLE')
  //   setValue('temp', 'UNAVAILABLE')
  //   setValue('cputot', 'UNAVAILABLE')
  //   setValue('cpuuser', 'UNAVAILABLE')
  //   setValue('cpusys', 'UNAVAILABLE')
  //   setValue('memtot', 'UNAVAILABLE')
  //   setValue('memfree', 'UNAVAILABLE')
  //   setValue('memused', 'UNAVAILABLE')
  //   setValue('disksize', 'UNAVAILABLE')
  //   setValue('diskused', 'UNAVAILABLE')
  //   setValue('diskuse', 'UNAVAILABLE')
  //   setValue('diskavail', 'UNAVAILABLE')
  //   setValue('os', 'UNAVAILABLE')
  // }

  setValue(key, value) {
    cache.set(`${this.device.id}-${key}`, value, { quiet: true })
  }
}

//. move into cache

// get object in DATA_SET format for shdr,
// will return something like "free=48237472 used=12387743 total=38828348"
function getDataSet(obj) {
  // sanitize the keys as well as the values
  const str = Object.keys(obj)
    .map(key => `${sanitize(key)}=${sanitize(obj[key])}`)
    .join(' ')
  return str
}
// a local fn
function sanitize(value) {
  return String(value || '')
    .replaceAll(' ', '_')
    .replaceAll('\n', '_')
    .replaceAll('|', '-')
    .replaceAll('=', '-')
}
