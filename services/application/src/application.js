// import fs from 'fs'
import fetch from 'node-fetch'
import * as domain from './domain.js'

console.log(`MTConnect Application starting`)

// const username = 'postgres'
// const password = 'gralgrut'
// const host = 'timescaledb'
// const port = '5432'
// const database = 'tutorial'
// const connect = `postgres://${username}:${password}@${host}:${port}/${database}`

const url = process.env.URL || 'http://localhost:5000/sample'
const interval = Number(process.env.INTERVAL || 2000) // msec

const sample = '?from=1&count=200'

setInterval(shovel, interval)

async function shovel() {
  try {
    console.log(url + sample)
    const response = await fetch(url + sample, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    })
    const tree = await response.json()
    // fs.writeFileSync('../example.json', JSON.stringify(tree))
    // domain.traverse(tree, dataItems => console.log(dataItems[0]))
    domain.traverse(tree, console.log)

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
