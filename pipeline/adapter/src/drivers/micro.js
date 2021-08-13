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
        const specs = {}
        inputs.values.forEach(value => (specs[value.item] = value.subitems))

        // read the specs data
        const data = await si.get(specs)
        console.log(data)

        // write values to cache
        setValue('availability', 'AVAILABLE') //. get from inputs
        // setValue('temperature', data.cpuTemperature.main)
        // setValue('memory', getDataSet(data.mem))
        // setValue('cpu', getDataSet(data.currentLoad))
        inputs.values.forEach(value => {
          const foo =
            value.representation === 'dataset'
              ? getDataSet(data[value.item])
              : data[value.item].main
          setValue(value.name, foo)
        })
      } catch (e) {
        setUnavailable()
        console.error(e)
      }
    }

    //. get this list from inputs also
    function setUnavailable() {
      setValue('availability', 'UNAVAILABLE')
      setValue('memory', 'UNAVAILABLE')
      setValue('temperature', 'UNAVAILABLE')
      setValue('cpu', 'UNAVAILABLE')
    }

    function setValue(name, value) {
      cache.set(`${deviceId}-${name}`, { value })
    }
  }
}

// get object in DATA_SET format for shdr,
// eg "free=48237472 used=12387743 total=38828348"
//. this should be part of cache.js
function getDataSet(obj) {
  const str = Object.keys(obj)
    .map(key => `${key}=${obj[key]}`)
    .join(' ')
  return str
}
