// import fs from 'fs'
import fetch from 'node-fetch'
import pg from 'pg' // postgres driver
const { Client } = pg
import * as domain from './domain.js'

console.log(`MTConnect Application starting`)

const client = new Client()
await client.connect() // uses envars PGHOST, PGPORT, etc - set with `source .env`
// const res = await client.query('SELECT $1::text as message', ['Hello world!'])
// console.log(res.rows[0].message) // Hello world!
// await client.end()

// const baseUrl = process.env.BASE_URL || 'http://localhost:5000'
const baseUrl = process.env.BASE_URL || 'http://192.168.0.109:5000'
const interval = Number(process.env.INTERVAL || 2000) // msec

setInterval(shovel, interval)

async function shovel() {
  const currentUrl = `${baseUrl}/current`
  // const from = 1
  // const count = 200
  // const sampleUrl = `${baseUrl}/sample?from=${from}&count=${count}`
  const url = currentUrl
  try {
    // console.log(`fetch from ${url}...`)
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
    domain.traverse(tree, async dataItems => {
      if (dataItems[0].type === 'Execution') {
        // console.log(dataItems[0])
        const dataItem = dataItems[0] //.
        console.log(dataItem.value)
        // dump value to db
        const sql = `INSERT INTO execution(time, value) VALUES($1, $2) RETURNING *`
        const values = [dataItem.timestamp, dataItem.value]
        await client.query(sql, values)
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

// await client.end()
