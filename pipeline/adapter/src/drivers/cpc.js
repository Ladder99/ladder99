// cpc autoclave driver

import net from 'net' // node lib for tcp - https://nodejs.org/api/net.html

export class AdapterDriver {
  init({ deviceId, protocol, host, port, cache, inputs, socket }) {
    console.log(`CPC driver connecting to TCP server at`, { host, port }, '...')
    const client = net.connect(port, host)

    client.on('error', error => {
      console.log(error)
    })

    client.on('data', data => {
      const str = data.toString()
      console.log(`CPC driver received ${str}...`)
    })

    client.on('end', () => {
      console.log('CPC driver disconnected from server...')
    })

    client.on('connect', () => {
      console.log(`CPC driver connected...`)
      // const cmd = `PathListGet:ReadValues:.Autoclave.Inputs.AIRTC\\Value,.Autoclave.RecipeProcessor\\RunStatus`
      const cmd = `PathListGet:ReadValues:.Autoclave.Variables.OperatorName\\Value`
      console.log(`CPC driver writing ${cmd}...`)
      client.write(cmd + '\n')
    })
  }
}
