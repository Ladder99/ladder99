// capture agent data and write to database

import fetch from 'node-fetch'
import { Database, aql } from 'arangojs' // arangodb driver
import * as logic from './logic.js'

console.log(`MTConnect Application starting`)
console.log(`----------------------------------------------------------`)

const arangodbUrl = process.env.ARANGODB_URL || 'http://localhost:8529'
const arangodbDatabase = process.env.ARANGODB_DATABASE || 'ladder99-default'

const system = new Database(arangodbUrl)

// create our db if not there
const dbs = await system.listDatabases()
console.log(dbs)
if (!dbs.includes(arangodbDatabase)) {
  await system.createDatabase(arangodbDatabase)
}
const db = system.database(arangodbDatabase)

// const res = await client.query('SELECT $1::text as message', ['Hello world!'])
// console.log(res.rows[0].message) // Hello world!
const now = Date.now()
const cursor = await db.query(aql`
  RETURN ${now}
`)
const result = await cursor.next()
console.log(result)

// const baseUrl = process.env.AGENT_BASE_URL || 'http://raspberrypi.local:5000'
const baseUrl = process.env.AGENT_BASE_URL || 'http://localhost:5000'
const interval = Number(process.env.INTERVAL || 2000) // msec

setInterval(shovel, interval)

async function shovel() {
  const url = `${baseUrl}/current`
  // const from = 1
  // const count = 200
  // const url = `${baseUrl}/sample?from=${from}&count=${count}`
  try {
    // console.log(`fetch from ${url}...`)
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    })
    const tree = await response.json()

    // traverse the tree and output state
    logic.traverse(tree, async dataItems => {
      if (dataItems[0].type === 'Execution') {
        // console.log(dataItems[0])
        const dataItem = dataItems[0] //. just one?
        console.log(dataItem.value)
        // dump value to db
        //. add try block
        // const sql = `INSERT INTO execution(time, value) VALUES($1, $2) RETURNING *`
        // const values = [dataItem.timestamp, dataItem.value]
        // await client.query(sql, values)
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
