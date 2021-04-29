import fetch from 'node-fetch'

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
    const json = await response.json()
    console.log(json)
    const streams = json.MTConnectStreams.Streams
    traverse(streams, node => {
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

// recurse down a tree of nodes, calling callback on each one
function traverse(node, callback) {
  if (Array.isArray(node)) {
    node.forEach(subnode => traverse(subnode, callback))
  } else if (node !== null && typeof node === 'object') {
    Object.values(node).forEach(value => traverse(value, callback))
  } else {
    callback(node)
  }
}
