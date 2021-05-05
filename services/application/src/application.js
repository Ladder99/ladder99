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

// const baseUrl = process.env.BASE_URL || 'http://localhost:5000'
const baseUrl = process.env.BASE_URL || 'http://192.168.0.109:5000/current'
const interval = Number(process.env.INTERVAL || 2000) // msec

setInterval(shovel, interval)

async function shovel() {
  const currentUrl = `${baseUrl}/current`
  // const from = 1
  // const count = 200
  // const sampleUrl = `${baseUrl}/sample?from=${from}&count=${count}`
  const url = currentUrl
  try {
    console.log(`fetch from ${url}...`)
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    })
    const tree = await response.json()

    //. use this to save example outputs - rename to example-current.js etc
    // fs.writeFileSync('./example.json', JSON.stringify(tree))

    // traverse the tree and output state
    domain.traverse(tree, dataItems => {
      if (dataItems[0].type === 'Execution') {
        console.log(dataItems[0])
      }
    })
  } catch (error) {
    if (error.code === 'ENOTFOUND') {
      console.log(`Agent not found at ${url} - waiting...`)
    } else {
      throw error
    }
  }
}
