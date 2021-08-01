// cpc autoclave driver

import net from 'net' // node lib for tcp - https://nodejs.org/api/net.html

export class AdapterDriver {
  init({ deviceId, protocol, host, port, cache, inputs, socket }) {
    console.log(`Initialize cpc plugin...`)

    // get ids and query string
    const ids = inputs.inputs.map(input => `${deviceId}-${input.key}`)
    const paths = inputs.inputs.map(input => input.path).join(',')
    const query = `PathListGet:ReadValues:${paths}`
    console.log('ids', ids) // eg ['ac1-operator_name', 'ac1-recipe_description', ...]
    console.log('query', query) // eg 'PathListGet:ReadValues:.Autoclave.Alarms.ControlPower\Condition,...'

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
        const value = values[i]
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
