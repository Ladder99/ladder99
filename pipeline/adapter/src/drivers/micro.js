// microcontroller driver
// fetches data from microcontroller/pc etc

import si from 'systeminformation' // see https://github.com/sebhildebrandt/systeminformation

const pollInterval = 2000 // msec //. get from setup

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

        setValue('temperature', data.cpuTemperature.main)
        setValue('memory-total', data.mem.total)
        setValue('memory-free', data.mem.free)
        setValue('memory-used', data.mem.used)
        setValue('cpu-total', data.currentLoad.currentLoad)
        setValue('cpu-user', data.currentLoad.currentLoadUser)
        setValue('cpu-system', data.currentLoad.currentLoadSystem)

        setValue('os', getDataSet(data.osInfo))

        // setValue('memory', getDataSet(data.mem))
        // setValue('cpu', getDataSet(data.currentLoad))
        // inputs.inputs.forEach(input => {
        //   const value =
        //     input.representation === 'dataset'
        //       ? getDataSet(data[input.item])
        //       : data[input.item].main
        //   setValue(input.name, value)
        //   //. add each subitem individually also - experimental
        //   input.subitems.split(', ').forEach(subitem => {
        //     setValue(input.name + '-' + subitem, data[input.item][subitem])
        //   })
        // })
      } catch (e) {
        setUnavailable()
        console.error(e)
      }
    }

    //. get this list from inputs also
    function setUnavailable() {
      setValue('availability', 'UNAVAILABLE')
      setValue('condition', 'UNAVAILABLE')
      setValue('memory', 'UNAVAILABLE')
      setValue('temperature', 'UNAVAILABLE')
      setValue('cpu', 'UNAVAILABLE')
      setValue('os', 'UNAVAILABLE')
    }

    function setValue(name, value) {
      cache.set(`${deviceId}/${name}`, { value })
      // cache.set(`${deviceName}/${name}`, { value })
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
