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
  // get postgres connection and start polling
  const client = new Client()
  await client.connect() // uses envars PGHOST, PGPORT, etc
  await setupTable(client)
  setInterval(() => shovel(client), interval)
})()

async function setupTable(client) {
  const tableName = 'values'
  const sql = `
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;
CREATE TABLE IF NOT EXISTS "${tableName}" (
  id text NOT NULL,
  time timestamptz NOT NULL,
  value json
);
SELECT create_hypertable('"${tableName}"', 'time', if_not_exists => TRUE);
`
  console.log(`Creating table '${tableName}' if not there...`)
  await client.query(sql)
}

let from = null
let count = 200
// let next = null

async function shovel(client) {
  let json = await getData('sample', from, count)

  // check for errors
  // eg <Error errorCode="OUT_OF_RANGE">'from' must be greater than 647331</Error>
  if (json.MTConnectError) {
    console.log(json)
    const errorCodes = json.MTConnectError.Errors.map(e => e.Error.errorCode)
    if (errorCodes.includes('OUT_OF_RANGE')) {
      // we lost some data, so reset the index and get from start of buffer
      from = null
      json = await getData('sample', from, count)
    }
  }

  // get sequence info from header
  const { firstSequence, nextSequence, lastSequence } =
    json.MTConnectStreams.Header
  from = nextSequence

  const dataItems = getDataItems(json)
  await writeDataItems(dataItems, client)

  // //. if gap, fetch and write that also
  // const gap = false
  // if (gap) {
  //   const json = await getData('sample', from, count)
  //   const dataItems = getDataItems(json)
  //   await writeDataItems(dataItems, client)
  // }
}

// traverse the json tree and return all data items
function getDataItems(json) {
  const allDataItems = []
  logic.traverse(json, dataItems => {
    allDataItems.push(dataItems)
  })
  return allDataItems
}

//. gather up all items into one array, then put all into one INSERT stmt
// see https://stackoverflow.com/a/63167970/243392 etc
async function writeDataItems(dataItems, client) {
  for (const dataItem of dataItems) {
    const { dataItemId, timestamp, value } = dataItem
    const id = dataItemId
    const type = typeof value === 'string' ? 'text' : 'numeric'
    const sql = `INSERT INTO values (id, time, value) VALUES ($1, $2, to_json($3::${type}));`
    const values = [id, timestamp, value]
    console.log(sql, { values })
    //. add try block
    await client.query(sql, values)
  }
}

// get data from agent rest endpoint
async function getData(type, from, count) {
  const url = getUrl(type, from, count)
  console.log(`Getting data from ${url}...`)
  try {
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

// get the rest endpoint url - from and count are optional
function getUrl(type, from, count) {
  const url =
    from !== null
      ? `${baseUrl}/${type}?from=${from}&count=${count}`
      : `${baseUrl}/${type}`
  return url
}
