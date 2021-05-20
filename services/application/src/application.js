// mtconnect application
// capture agent data and write to database
// see https://arangodb.github.io/arangojs/latest/modules/_index_.html

import fetch from 'node-fetch'
import { Database, aql } from 'arangojs' // https://github.com/arangodb/arangojs
import * as logic from './logic.js'

console.log(`MTConnect Application starting`)
console.log(`----------------------------------------------------------`)

// arangodb
const arangodbUrl = process.env.ARANGODB_URL || 'http://localhost:8529'
const arangodbDatabase = process.env.ARANGODB_DATABASE || 'ladder99-default'

// agent
const baseUrl = process.env.AGENT_BASE_URL || 'http://localhost:5000'
const interval = Number(process.env.INTERVAL || 2000) // msec

;(async function () {
  const system = new Database(arangodbUrl)

  // create our db if not there
  const dbs = await system.listDatabases()
  console.log(dbs)
  if (!dbs.includes(arangodbDatabase)) {
    console.log(`Creating database ${arangodbDatabase}...`)
    await system.createDatabase(arangodbDatabase)
  }
  const db = system.database(arangodbDatabase)

  // create collections if not there
  const collections = await db.listCollections()
  if (!collections.find(collection => collection.name === 'nodes')) {
    console.log(`Creating nodes collection...`)
    await db.createCollection('nodes')
  }
  if (!collections.find(collection => collection.name === 'edges')) {
    console.log(`Creating edges collection...`)
    await db.createEdgeCollection('edges')
  }

  // // run a test query
  // const now = Date.now()
  // const cursor = await db.query(aql`
  //   RETURN ${now}
  // `)
  // const result = await cursor.next()
  // console.log(result)

  // get data structure
  const url = `${baseUrl}/probe`
  const response = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  })
  const tree = await response.json()
  console.log(tree)

  setInterval(shovel, interval)
})()

async function shovel() {
  //. use /sample, and fetch any missing sequence nums
  const url = `${baseUrl}/current`
  // const from = 1
  // const count = 200
  // const url = `${baseUrl}/sample?from=${from}&count=${count}`
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
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
