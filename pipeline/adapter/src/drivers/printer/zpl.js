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
    //. do try catch
    // const client = net.connect(port, host)

    //. send ~HQ__ command to get printer status

    // // connected to device - poll it for data by writing a command
    // client.on('connect', () => {
    //   console.log(`ZPL driver connected...`)
    //   poll()
    //   // setInterval(poll, 2000) //. do this
    // })

    // // receive data from device, write to cache, output shdr to agent
    // client.on('data', data => {
    //   const str = data.toString() // eg 'PathListGet:ReadValues:=,True,Joshau Schneider,254.280816,,0'
    //   console.log(`ZPL driver received ${str}...`)
    //   const [_, valuesStr] = str.split(':=')
    //   const values = valuesStr.split(',') // eg ['', 'True', 'Joshau Schneider', ...]
    //   // write values to cache, which will output shdr to agent
    //   ids.forEach((id, i) => {
    //     const type = types[i] // eg 'boolean'
    //     const typeFn = typeFns[type] // eg value => value==='True'
    //     const value = typeFn(values[i]) // eg true
    //     cache.set(id, { value }) // set cache value, which triggers shdr output
    //   })
    // })

    // client.on('error', error => {
    //   console.log(error)
    // })

    // client.on('end', () => {
    //   console.log('ZPL driver disconnected from server...')
    // })

    // // 'poll' device using tcp client.write
    // function poll() {
    //   console.log(`ZPL driver writing ${query}...`)
    //   client.write(query + '\r\n')
    // }
  }
}
