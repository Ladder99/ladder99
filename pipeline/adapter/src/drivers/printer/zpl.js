// zpl printer driver

import net from 'net' // node lib for tcp - https://nodejs.org/api/net.html

const typeFns = {
  undefined: value => value,
  boolean: value => value === 'True',
}

export class AdapterDriver {
  init({ deviceId, protocol, host, port, cache, inputs, socket }) {
    console.log(`Initialize ZPL driver...`)

    // // get ids and query string
    // const ids = inputs.inputs.map(input => `${deviceId}/${input.key}`) // eg ['pr1/operator_name', 'pr1/recipe_description', ...]
    // const paths = inputs.inputs.map(input => input.path).join(',')
    // const types = inputs.inputs.map(input => input.type) // eg [undefined, undefined, boolean, ...]
    // const query = `PathListGet:ReadValues:${paths}` // eg 'PathListGet:ReadValues:.Autoclave.Alarms.ControlPower\Condition,...'
    // console.log('ids', ids)
    // console.log('query', query)

    console.log(`ZPL driver connecting to TCP server at`, { host, port }, '...')

    //... for testing - delete this
    // set cache values, which trigger shdr output
    cache.set(`${deviceId}/avail`, { value: 'AVAILABLE' }) // or UNAVAILABLE
    cache.set(`${deviceId}/emp`, { value: 'ON' }) // or OFF
    cache.set(`${deviceId}/msg`, { value: 'Some message' })
    cache.set(`${deviceId}/cond`, { value: 'WARNING' }) // or NORMAL or ERROR

    try {
      const client = net.connect(port, host)

      // connected to device - poll it for data by writing a command
      client.on('connect', () => {
        console.log(`ZPL driver connected...`)
        poll()
        // setInterval(poll, 2000) //. do this
      })

      // command to get printer status
      // const cmd = `! U1 getvar "zpl.system_status"` // doesn't work on old printer
      const cmd = `~HQES` // host query - see zpl programming guide p205 - works on old and new printers

      // receive data from device, write to cache, output shdr to agent
      client.on('data', data => {
        // const str = data.toString() // eg '0,0,00000000,00000000,0,00000000,00000000' // sgd returns
        // response starts with STX, has CR LF between each line, ends with ETX
        const str = data.toString() // eg 'PRINTER STATUS ERRORS: 1 00000000 00000005 WARNINGS: 1 00000000 00000002' // zpl returns
        console.log(`ZPL driver received response:\n`, str)
        //. parse status into cache keyvalues
        // write to cache, which will trigger shdr output
        //   const type = types[i] // eg 'boolean'
        //   const typeFn = typeFns[type] // eg value => value==='True'
        //   const value = typeFn(values[i]) // eg true
        const id = `${deviceId}/avail`
        const value = 'AVAILABLE'
        cache.set(id, { value }) // set cache value, which triggers shdr output
      })
      client.on('error', error => {
        console.log(error)
      })
      client.on('end', () => {
        console.log('ZPL driver disconnected from server...')
        //. set all values to UNAVAILABLE?
      })
      // 'poll' device using tcp client.write
      function poll() {
        console.log(`ZPL driver writing ${cmd}...`)
        client.write(cmd + '\r\n')
      }
    } catch (err) {
      console.log(err)
      //. keep trying eh?
    }
  }
}
