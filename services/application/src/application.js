// mtconnect application
// capture agent data and write to database

import fetch from 'node-fetch'
import pg from 'pg' // postgres driver - import { Client } from 'pg' gives error
// const { Client } = pg
const { Pool } = pg
import * as logic from './logic.js'

console.log(`MTConnect Application starting`)
console.log(`---------------------------------------------------`)

// get envars
const baseUrl = process.env.AGENT_BASE_URL || 'http://localhost:5000'
const fetchInterval = Number(process.env.FETCH_INTERVAL || 2000) // msec
const fetchCount = Number(process.env.FETCH_COUNT || 200)

// get postgres connection and start polling
async function main() {
  // const client = new Client()
  const pool = new Pool()
  // let client
  // let connected = false
  const client = await pool.connect() // uses envars PGHOST, PGPORT etc
  // do {
  //   try {
  //     client = new Client()
  //     await client.connect() // uses envars PGHOST, PGPORT, etc
  //   } catch (error) {
  //     if (error.code === 'ECONNREFUSED') {
  //       await sleep(2000)
  //     } else {
  //       throw error
  //     }
  //   }
  // } while (!connected)
  await setupTables(client)
  await initialize(client)
  // await new Promise(resolve => setTimeout(resolve, fetchInterval))
  await sleep(fetchInterval)
  setInterval(() => shovel(client), fetchInterval)

  //. need init:true in compose yaml?
  process
    .on('SIGTERM', getShutdown('SIGTERM'))
    .on('SIGINT', getShutdown('SIGINT'))

  // get shutdown handler
  function getShutdown(signal) {
    return error => {
      console.log()
      console.log(`Signal ${signal} received - shutting down...`)
      if (error) console.error(error.stack || error)
      console.log(`Releasing db client...`)
      // mqtt.end()
      client.release()
      process.exit(error ? 1 : 0)
    }
  }
}

main()

async function setupTables(client) {
  const sql = `
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

CREATE TABLE IF NOT EXISTS history (
  time timestamptz NOT NULL,
  id text NOT NULL,
  value jsonb
);

SELECT create_hypertable('history', 'time', if_not_exists => TRUE);

CREATE OR REPLACE VIEW history_numeric
AS SELECT "time", id, value::numeric
FROM history
WHERE jsonb_typeof(value) = 'number'::text;
`
  console.log(`Creating db structures if not there...`)
  await client.query(sql)
}

async function initialize(client) {
  const json = await getData('current')
  // // get sequence info from header?
  // const { firstSequence, nextSequence, lastSequence } =
  //   json.MTConnectStreams.Header
  // from = nextSequence
  const dataItems = getDataItems(json)
  await writeDataItems(dataItems, client)
}

let from = null
let count = fetchCount
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
    allDataItems.push(...dataItems)
  })
  return allDataItems
}

// gather up all items into array, then put all into one INSERT stmt, for speed.
// otherwise pipeline couldn't keep up.
// see https://stackoverflow.com/a/63167970/243392 etc
async function writeDataItems(dataItems, client) {
  let rows = []
  for (const dataItem of dataItems) {
    let { dataItemId, timestamp, value } = dataItem
    const id = dataItemId
    value = value === undefined ? 'undefined' : value
    if (typeof value !== 'object') {
      const type = typeof value === 'string' ? 'text' : 'numeric'
      const row = `('${timestamp}', '${id}', to_jsonb('${value}'::${type}))`
      rows.push(row)
    }
  }
  if (rows.length > 0) {
    const values = rows.join(',\n')
    const sql = `INSERT INTO history (time, id, value) 
  VALUES
  ${values};`
    console.log(sql)
    //. add try block
    await client.query(sql)
  }
}

// get data from agent rest endpoint.
// type is 'probe', 'current', or 'sample'.
// from and count are optional.
async function getData(type, from, count) {
  // const url = getUrl(type, from, count)
  const url =
    from !== undefined
      ? `${baseUrl}/${type}?${
          from !== null ? 'from=' + from + '&' : ''
        }count=${count}`
      : `${baseUrl}/${type}`
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

// // get the rest endpoint url - from and count are optional
// function getUrl(type, from, count) {
//   const url =
//     from !== null
//       ? `${baseUrl}/${type}?from=${from}&count=${count}`
//       : `${baseUrl}/${type}`
//   return url
// }

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
