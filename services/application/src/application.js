import fetch from 'node-fetch'
import * as domain from './domain'

console.log(`MTConnect Application starting`)

// const username = 'postgres'
// const password = 'gralgrut'
// const host = 'timescaledb'
// const port = '5432'
// const database = 'tutorial'
// const connect = `postgres://${username}:${password}@${host}:${port}/${database}`

const url = process.env.URL || 'http://agent:5000/sample'
const interval = Number(process.env.INTERVAL || 2000) // msec

setInterval(shovel, interval)

async function shovel() {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    })
    const tree = await response.json()
    // console.log(tree)
    // const streams = tree.MTConnectStreams.Streams
    domain.traverse(tree, node => {
      console.log(node)
    })
    // console.dir(json, { depth: null })
    // const streams = json.MTConnectStreams.Streams
    // for (const stream of streams) {
    //   const device = stream.DeviceStream
    //   console.log(device)
    //   const components = device.ComponentStreams
    //   for (const component of components) {
    //     console.log(component)
    //     const events = component.ComponentStream.Events
    //     for (const event of events) {
    //       console.log(event)
    //     }
    //   }
    // }
  } catch (error) {
    if (error.code === 'ENOTFOUND') {
      console.log(`Agent not found at ${url} - waiting...`)
    } else {
      throw error
    }
  }
}
