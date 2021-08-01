// cpc autoclave driver

// CPC (Composite Processing Control) is ASC's flagship software and
// control system designed specifically for control of composite
// processes in autoclaves, ovens, presses, formers, and bond tools.
// Since its creation, CPC has been at the forefront of composite technology.
// CPC has evolved over the last 31-years and is now the leader in the
// control of autoclaves and ovens. Most Tier I, II, and III aerospace
// companies standardize their controls on CPC. Every day, more than
// 1500 pieces of equipment are controlled by CPC.

import net from 'net' // node lib for tcp - https://nodejs.org/api/net.html

const typeFns = {
  undefined: value => value,
  boolean: value => value === 'True',
}

export class AdapterDriver {
  init({ deviceId, protocol, host, port, cache, inputs, socket }) {
    console.log(`Initialize CPC driver...`)

    // get ids and query string
    const ids = inputs.inputs.map(input => `${deviceId}-${input.key}`) // eg ['ac1-operator_name', 'ac1-recipe_description', ...]
    const paths = inputs.inputs.map(input => input.path).join(',')
    const types = inputs.inputs.map(input => input.type) // eg [undefined, undefined, boolean, ...]
    const query = `PathListGet:ReadValues:${paths}` // eg 'PathListGet:ReadValues:.Autoclave.Alarms.ControlPower\Condition,...'
    console.log('ids', ids)
    console.log('query', query)

    console.log(`CPC driver connecting to TCP server at`, { host, port }, '...')
    const client = net.connect(port, host)

    // connected to device - poll it for data
    client.on('connect', () => {
      console.log(`CPC driver connected...`)
      poll()
      // setInterval(poll, 2000) //. do this
    })

    // receive data from device, write to cache, output shdr to agent
    client.on('data', data => {
      const str = data.toString() // eg 'PathListGet:ReadValues:=,True,Joshau Schneider,254.280816,,0'
      console.log(`CPC driver received ${str}...`)
      const [_, valuesStr] = str.split(':=')
      const values = valuesStr.split(',') // eg ['', 'True', 'Joshau Schneider', ...]
      // write values to cache, which will output shdr to agent
      ids.forEach((id, i) => {
        const type = types[i] // eg 'boolean'
        const typeFn = typeFns[type] // eg value => value==='True'
        const value = typeFn(values[i]) // eg true
        cache.set(id, { value })
      })
    })

    client.on('error', error => {
      console.log(error)
    })

    client.on('end', () => {
      console.log('CPC driver disconnected from server...')
    })

    // 'poll' device using tcp client.write
    function poll() {
      console.log(`CPC driver writing ${query}...`)
      client.write(query + '\r\n')
    }
  }
}
