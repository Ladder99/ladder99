// host driver
// fetches data from host system, writes to cache.
// see setups/common/modules/host folder.

import si from 'systeminformation' // see https://github.com/sebhildebrandt/systeminformation

import * as lib from '../common/lib.js' // for lib.round

const defaultPollInterval = 5000 // ms

export class AdapterDriver {
  //
  start({ device, cache, module }) {
    //
    console.log(`Host start driver...`)
    this.device = device
    this.cache = cache
    this.module = module
    this.inputs = module?.inputs?.inputs || {}

    // get queries from inputs.yaml and start polling data
    const itemKeys = Object.keys(this.inputs) // eg ['cpuTemperature', 'currentLoad', 'mem', 'fsSize']
    for (let itemKey of itemKeys) {
      const { interval, subitems } = this.inputs[itemKey] // eg { interval, subitems }
      const subitemString = Object.keys(subitems).join(',') // eg 'main'
      const query = { [itemKey]: subitemString } // eg { cpuTemperature: 'main' }
      // query data
      this.poll(query)
      // start polling data also, unless interval is null
      if (interval !== null) {
        const pollInterval = interval ?? defaultPollInterval
        setInterval(this.poll.bind(this, query), pollInterval)
      }
    }

    // write to cache
    this.setValue('avail', 'AVAILABLE')
    this.setValue('cond', 'NORMAL')
  }

  //

  async poll(query) {
    // get data from systeminformation
    // eg if query is { cpuTemperature: 'main' }, data will be { cpuTemperature: { main: 50.5 }}.
    let data
    try {
      data = await si.get(query)
    } catch (error) {
      console.log(error.message)
      //. set keys to unavailable
      return
    }

    // extract data and write all values to cache
    const itemKey = Object.keys(data)[0] // eg 'cpuTemperature'
    const itemData = data[itemKey] // eg { main: 50.5 }, or [ { fs: 'C:\\', size: 16777216, used: 0, use: 0, available: 16777216 }, ... ]
    const inputData = this.inputs[itemKey] // eg { platforms, subitems }

    const that = this
    if (itemKey === 'fsSize') {
      handleDriveData()
    } else {
      handleOtherData()
    }

    // fsSize returns an array, so handle specially -
    // eg itemData = [ { fs: 'C:\\', size: 16777216, used: 0, available: 16777216 }, { fs: 'D:\\', ...} ]
    function handleDriveData() {
      const { platforms, subitems } = inputData
      const subitemKeys = Object.keys(subitems) // eg ['fs', 'size', 'used', 'available']
      const platform = process.platform // eg aix darwin freebsd linux openbsd sunos win32 android
      const drivesStr = platforms[platform] || '' // eg 'C,D'
      const drives = drivesStr.split(',') // eg ['C', 'D']

      // sum up specified drives data
      const sum = { size: 0, used: 0, available: 0 }
      for (let driveData of itemData) {
        const { fs } = driveData // eg 'C'
        if (drives.includes(fs)) {
          for (let subitemKey of subitemKeys) {
            if (subitemKey !== 'fs') {
              const value = driveData[subitemKey]
              sum[subitemKey] += value
            }
          }
        }
      }

      // calculate use percentage
      const use = lib.round((sum.used / sum.size) * 100, 0)

      // write to cache
      that.setValue('use', use)
      for (let subitemKey of subitemKeys) {
        if (subitemKey !== 'fs') {
          const { name, decimals } = subitems[subitemKey] // eg { name: 'temp', decimals: 1 }
          const value = lib.round(sum[subitemKey], decimals) // eg 50.5
          that.setValue(name, value)
        }
      }
    }

    // handle other items, eg
    // { currentLoad: {
    //     currentLoad: 0.01,
    //     currentLoadUser: 0.01,
    //     currentLoadSystem: 0
    //   } }
    // { mem: { total: 16777216, free: 16777216, used: 0 } }
    function handleOtherData() {
      const { subitems } = inputData
      const subitemKeys = Object.keys(itemData) // eg ['main']
      for (let subitemKey of subitemKeys) {
        const subitemData = itemData[subitemKey] // eg 50.51
        const { name, decimals } = subitems[subitemKey] // eg { name: 'temp', decimals: 1 }
        const value = lib.round(subitemData, decimals) // eg 50.5
        that.setValue(name, value)
      }
    }
  }

  // set a cache value
  setValue(key, value) {
    console.log('setValue', key, value)
    this.cache.set(`${this.device.id}-${key}`, value)
  }
}
