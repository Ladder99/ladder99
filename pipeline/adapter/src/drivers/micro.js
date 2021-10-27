// microcontroller driver
// fetches data from microcontroller/pc etc
// see modules/micro folder.

import si from 'systeminformation' // see https://github.com/sebhildebrandt/systeminformation

const pollInterval = 5000 // msec //. get from setup

export class AdapterDriver {
  init({ deviceId, protocol, host, port, cache, inputs, socket }) {
    console.log(`Initialize microcontroller driver...`)

    setUnavailable()
    setInterval(readData, pollInterval)

    async function readData() {
      try {
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
        console.log(data)

        // write values to cache
        setValue('availability', 'AVAILABLE')
        setValue('condition', 'NORMAL')
        setValue('temperature', rounded(data.cpuTemperature.main, 1))
        setValue('memory-total', rounded(data.mem.total))
        setValue('memory-free', rounded(data.mem.free))
        setValue('memory-used', rounded(data.mem.used))
        setValue('cpu-total', rounded(data.currentLoad.currentLoad, 1))
        setValue('cpu-user', rounded(data.currentLoad.currentLoadUser, 1))
        setValue('cpu-system', rounded(data.currentLoad.currentLoadSystem, 1))
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
      cache.set(`${deviceId}-${name}`, value)
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

function rounded(value, decimals = 0) {
  if (value !== null && value !== undefined) {
    return Number(value).toFixed(decimals)
  }
  return null
}
