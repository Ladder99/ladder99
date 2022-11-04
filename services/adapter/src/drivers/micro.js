// microcontroller driver
// fetches data from microcontroller/pc etc
// see modules/micro folder.

//. this library causes highcpu on windows - 2022-02
// https://github.com/sebhildebrandt/systeminformation/issues/626
import si from 'systeminformation' // see https://github.com/sebhildebrandt/systeminformation

import * as lib from '../common/lib.js' // for lib.rounded()

const pollInterval = 5000 // msec //. get from setup

export class AdapterDriver {
  start({ device, cache }) {
    console.log(`Micro start driver...`)

    setUnavailable()
    setInterval(readData, pollInterval)

    async function readData() {
      try {
        //. get disk space used
        // get specs object like { mem: 'total, free, used' }, as expected by si module
        // const specs = {}
        // inputs.inputs.forEach(input => (specs[input.item] = input.subitems))
        const specs = {
          cpuTemperature: 'main',
          mem: 'total, free, used',
          currentLoad: 'currentLoad, currentLoadUser, currentLoadSystem',
          osInfo: 'platform, distro, release, codename, arch, hostname',
        }

        // read the specs data
        const data = await si.get(specs)
        // console.log(data) // too much info

        // write values to cache
        setValue('availability', 'AVAILABLE')
        setValue('condition', 'NORMAL')
        setValue('temperature', lib.rounded(data.cpuTemperature.main))
        setValue('memory-total', lib.rounded(data.mem.total, -7))
        setValue('memory-free', lib.rounded(data.mem.free, -7))
        setValue('memory-used', lib.rounded(data.mem.used, -7))
        setValue('cpu-total', lib.rounded(data.currentLoad.currentLoad))
        setValue('cpu-user', lib.rounded(data.currentLoad.currentLoadUser))
        setValue('cpu-system', lib.rounded(data.currentLoad.currentLoadSystem))
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
