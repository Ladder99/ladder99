// cpc autoclave driver

import net from 'net' // node lib for tcp

export class AdapterDriver {
  init({ deviceId, protocol, host, port, cache, inputs, socket }) {
    console.log(`CPC driver connecting to TCP server at`, { host, port }, '...')
    const client = net.connect(port, host, () => {
      console.log('CPC driver connected...')
    })
    client.on('error', error => {
      console.log(error)
    })
    client.on('data', data => {
      console.log(data.toString())
    })
    client.on('connect', () => {
      console.log(`CPC connected 2`)
      client.write(
        Buffer.from(
          `PathListGet:ReadValues:.Autoclave.Inputs.AIRTC\\Value,.Autoclave.RecipeProcessor\\RunStatus`
        )
      )
    })
  }
}
