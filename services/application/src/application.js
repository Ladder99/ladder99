// mtconnect application
// capture agent data and write to database

import fetch from 'node-fetch'
import pg from 'pg' // postgres driver - import { Client } from 'pg' gives error
const { Client } = pg
import * as logic from './logic.js'

console.log(`MTConnect Application starting`)
console.log(`---------------------------------------------------`)

// get envars
const baseUrl = process.env.AGENT_BASE_URL || 'http://localhost:5000'
const interval = Number(process.env.INTERVAL || 2000) // msec

;(async function () {
  // get postgres connection
  const client = new Client()
  await client.connect() // uses envars PGHOST, PGPORT, etc

  // // test connection
  // const res = await client.query('SELECT $1::text as message', ['Hello world!'])
  // console.log(res.rows[0].message) // Hello world!

  await setupTables(client)

  // start polling
  setInterval(() => shovel(client), interval)
})()

async function setupTables(client) {
  const json = await getData('probe')
  if (json) {
    // traverse the json tree and create tables if not already there
    logic.traverse(json, async dataItems => {
      dataItems.forEach(async dataItem => {
        const { id } = dataItem.DataItem
        const tableName = id
        const sql = `
CREATE TABLE IF NOT EXISTS "${tableName}" (
  time timestamptz NOT NULL,
  value json
);
SELECT create_hypertable('"${tableName}"', 'time', if_not_exists => TRUE);
`
        console.log(`Creating table '${tableName}'...`)
        await client.query(sql)
      })
    })
  }
  console.log('done')
}

let from = null
let count = 10
// let next = null

async function shovel(client) {
  console.log(`Getting sample from ${from} count ${count}...`)
  const json = await getData('sample', from, count)

  // get sequence info from header
  // const { firstSequence, nextSequence, lastSequence } =
  //   json.MTConnectStreams.Header
  const { nextSequence } = json.MTConnectStreams.Header
  from = nextSequence

  // traverse the json tree and output state
  logic.traverse(json, dataItems => {
    dataItems.forEach(async dataItem => {
      const { dataItemId, timestamp, value } = dataItem
      const tableName = dataItemId
      const type = typeof value === 'string' ? 'text' : 'numeric'
      const sql = `INSERT INTO "${tableName}" (time, value) VALUES($1, to_json($2::${type}));`
      const values = [timestamp, value]
      console.log(sql, { values })
      //. add try block
      await client.query(sql, values)
    })
  })
}

async function getData(type, from, count) {
  const url = getUrl(type, from, count)
  console.log('getData', url)
  try {
    // get json from agent
    const response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    })
    const json = await response.json()
    return json
  } catch (error) {
    if (error.code === 'ENOTFOUND') {
      console.log(`Agent not found at ${url}...`)
    } else {
      throw error
    }
  }
  return null
}

function getUrl(type, from, count) {
  const url =
    from !== null
      ? `${baseUrl}/${type}?from=${from}&count=${count}`
      : `${baseUrl}/${type}`
  return url
}
