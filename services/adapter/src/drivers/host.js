// host driver
// fetches systeminfo from host system.
// see setups/common/modules/host folder.

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

    this.inputs = module?.inputs?.inputs || {}
    this.query = this.getQuery(this.inputs)
    console.log(this.query)

    this.setUnavailable()
    this.poll() // first poll
    setInterval(this.poll.bind(this), pollInterval)
  }

  // get a systeminformation query, eg
  // {
  //   cpuTemperature: 'main',
  //   currentLoad: 'currentLoad, currentLoadUser, currentLoadSystem',
  //   mem: 'total, free, used',
  //   fsSize: 'fs, size, used, use, available', // gives an array
  //   osInfo: 'platform, distro, release, codename, arch, hostname',
  // }
  getQuery(inputs) {
    const query = {}
    Object.keys(inputs).forEach(item => {
      query[item] = Object.keys(inputs[item]).join(',')
    })
    return query
  }

  async poll() {
    try {
      const data = await si.get(this.query)

      // write values to cache
      this.setValue('avail', 'AVAILABLE')
      this.setValue('cond', 'NORMAL')

      // iterate over query inputs, extract info from data, write to cache
      // eg this.setValue('temp', lib.rounded(data.cpuTemperature.main, 1))
      // eg itemKey = 'cpuTemperature', subitemDict = {main: { name, decimals }}
      for (let [itemKey, subitemDict] of Object.entries(this.inputs)) {
        // console.log(itemKey, subitemDict)
        // eg subitemKey = 'main'
        for (let subitemKey of Object.keys(subitemDict)) {
          // eg subitem = { name, decimals }
          const subitem = subitemDict[subitemKey]
          const value = data[itemKey][subitemKey]
          // console.log(subitemKey, subitem, value)
          this.setValue(subitem.name, lib.rounded(value, subitem.decimals))
        }
      }

      //   // console.log(itemKey, subitemDict)
      //   if (Array.isArray(subitemDict)) {
      //     // eg fsSize is an array
      //     subitemDict.forEach(subitem => {
      //       for (let [subitemKey, subitemValue] of Object.entries(subitem)) {
      //         // console.log(subitemKey, subitemValue)
      //         this.setValue(subitemKey, subitemValue)
      //       }
      //     })
      //   } else {
      //     // all other items are objects
      //     for (let [subitemKey, subitemValue] of Object.entries(subitemDict)) {
      //       // console.log(subitemKey, subitemValue)
      //       this.setValue(subitemKey, subitemValue)
      //     }
      //   }
      // }

      // get total disk space as { size, used, use }

      //. a single fn could check for existence of overlay key, use that or a sum reduction.
      //. could store the fn in the inputs.yaml, or just use a fn name like 'sum' or 'overlay'.

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
      // const disk = data.fsSize?.find(o => o.fs === 'drvfs') || {}
      // const disk = data.fsSize?.find(o => o.fs === 'overlay') || {}

      // this.setValue('temp', lib.rounded(data.cpuTemperature.main, 1))
      // this.setValue('cputot', lib.rounded(data.currentLoad.currentLoad, 1))
      // this.setValue('cpuuser', lib.rounded(data.currentLoad.currentLoadUser, 1))
      // this.setValue(
      //   'cpusys',
      //   lib.rounded(data.currentLoad.currentLoadSystem, 1)
      // )
      // this.setValue('memtot', lib.rounded(data.mem.total, -6))
      // this.setValue('memfree', lib.rounded(data.mem.free, -6))
      // this.setValue('memused', lib.rounded(data.mem.used, -6))
      // this.setValue('disksize', disk.size) // bytes
      // this.setValue('diskused', lib.rounded(disk.used, -6)) // bytes rounded to mb
      // this.setValue('diskuse', lib.rounded(disk.use, 0)) // percent
      // this.setValue('diskavail', lib.rounded(disk.available, -6)) // bytes rounded to mb
      // this.setValue('os', getDataSet(data.osInfo))
      // //
    } catch (error) {
      console.log(error.message)
      this.setUnavailable()
    }
  }

  // set all keys to unavailable
  setUnavailable() {
    this.setValue('avail', 'UNAVAILABLE')
    this.setValue('cond', 'UNAVAILABLE')
    // for each input item, set each subitem.name to unavailable
    Object.values(this.inputs).forEach(item => {
      Object.values(item).forEach(subitem => {
        this.setValue(subitem.name, 'UNAVAILABLE')
      })
    })
  }

  // set a cache value
  setValue(key, value) {
    console.log('setValue', key, value)
    this.cache.set(`${this.device.id}-${key}`, value)
  }
}

//. move into cache.js

// get object in DATA_SET format for shdr.
// will return something like "free=48237472 used=12387743 total=38828348"
// need to sanitize the keys as well as the values.
function getDataSet(obj) {
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
