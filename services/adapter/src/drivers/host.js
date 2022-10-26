// host driver
// fetches systeminfo from host system.
// see setups/common/modules/host folder.

// this library causes highcpu on windows - 2022-02
// seems to be fixed, or at least works when run from git bash - 2022-09-26.
// see https://github.com/sebhildebrandt/systeminformation/issues/626
import si from 'systeminformation' // see https://github.com/sebhildebrandt/systeminformation

import * as lib from '../common/lib.js' // for lib.round

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

    // get a systeminformation query, eg
    // {
    //   cpuTemperature: 'main',
    //   currentLoad: 'currentLoad, currentLoadUser, currentLoadSystem',
    //   mem: 'total, free, used',
    //   fsSize: 'fs, size, used, use, available', // gives an array
    //   osInfo: 'platform, distro, release, codename, arch, hostname',
    // }
    this.query = {}
    Object.keys(this.inputs).forEach(item => {
      this.query[item] = Object.keys(this.inputs[item]).join(',')
    })

    this.setUnavailable()
    this.poll() // first poll
    setInterval(this.poll.bind(this), pollInterval)
  }

  async poll() {
    try {
      // get data, eg
      // {
      //   cpuTemperature: { main: 50.5 },
      //   currentLoad: {
      //     currentLoad: 0.01,
      //     currentLoadUser: 0.01,
      //     currentLoadSystem: 0
      //   },
      //   mem: { total: 16777216, free: 16777216, used: 0 },
      //   fsSize: [
      //     {
      //       fs: 'C:\\',
      //       size: 16777216,
      //       used: 0,
      //       use: 0,
      //       available: 16777216
      //     }
      //   ],
      //   osInfo: {
      //     platform: 'win32',
      //     distro: 'Windows 10',
      //     release: '10.0.19043',
      //     codename: 'Windows 10',
      //     arch: 'x64',
      //     hostname: 'DESKTOP'
      //   }
      // }
      const data = await si.get(this.query)

      // write to cache
      this.setValue('avail', 'AVAILABLE')
      this.setValue('cond', 'NORMAL')

      // iterate over query inputs, extract info from data, write to cache
      // eg this.setValue('temp', lib.round(data.cpuTemperature.main, 1))
      // eg itemKey = 'cpuTemperature', subitemDict = {main: { name, decimals }}
      for (let [itemKey, subitemDict] of Object.entries(this.inputs)) {
        // console.log(itemKey, subitemDict)
        // subitemKey is eg 'main'
        for (let subitemKey of Object.keys(subitemDict)) {
          // subitem is like { name, decimals }
          const subitem = subitemDict[subitemKey]
          const value = data[itemKey][subitemKey]
          // console.log(subitemKey, subitem, value)
          this.setValue(subitem.name, lib.round(value, subitem.decimals))
        }
      }
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
