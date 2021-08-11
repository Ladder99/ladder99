// microcontroller driver
// fetches data from microcontroller/pc etc

import si from 'systeminformation'

const pollInterval = 2000 // msec

export class AdapterDriver {
  init({ deviceId, protocol, host, port, cache, inputs, socket }) {
    console.log(`Initialize microcontroller driver...`)

    setUnavailable()
    setInterval(readData, pollInterval)

    async function readData() {
      try {
        // const data = await si.get({
        //   cpuTemperature: 'main, cores',
        //   mem: 'total, free, used',
        // })
        const data = await si.get(inputs.values)
        console.log(data)

        // write values to cache
        setValue('memory', getDataSet(data.mem))
        setValue('temperature', data.cpuTemperature.main)
        setAvailable()
      } catch (e) {
        setUnavailable()
        console.error(e)
      }
    }

    function setValue(name, value) {
      cache.set(`${deviceId}-${name}`, { value })
    }

    function setUnavailable() {
      setValue('availability', 'UNAVAILABLE')
      setValue('memory', 'UNAVAILABLE')
      setValue('temperature', 'UNAVAILABLE')
    }
    function setAvailable() {
      setValue('availability', 'AVAILABLE')
    }
  }
}

// get object in DATA_SET format for shdr,
// eg "free=48237472 used=12387743 total=38828348"
function getDataSet(obj) {
  const str = Object.keys(obj)
    .map(key => `${key}=${obj[key]}`)
    .join(' ')
  return str
}