// mtconnect application
// capture agent data and write to database

import fetch from 'node-fetch'
import pg from 'pg' // postgres driver - import { Client } from 'pg' gives error
const { Pool } = pg
import * as logic from './logic.js'

console.log(`MTConnect Application starting`)
console.log(`---------------------------------------------------`)

// get envars
const baseUrl = process.env.AGENT_BASE_URL || 'http://localhost:5000'
//. these should be dynamic - optimize on the fly
let fetchInterval = Number(process.env.FETCH_INTERVAL || 2000) // how often to fetch sample data, msec
let fetchCount = Number(process.env.FETCH_COUNT || 200) // how many samples to fetch each time

async function main() {
  // get postgres connection
  const client = await connect()

  // handle ctrl-c etc
  handleSignals(client)

  // setup tables and views
  await setupTables(client)

  //------------------------------------------------------------------------
  // probe
  // get device structures and write to db
  //------------------------------------------------------------------------
  probe: do {
    console.log(`Getting probe data...`)
    const json = await getData('probe')
    if (!json) {
      console.log(`No data available - will wait and try again...`)
      await sleep(4000)
      break probe
    }
    //. get all elements and their relations
    // const graph = getGraph(json)
    // console.log(graph)
    //. add all to nodes and edges tables
    // writeGraphStructure(graph)
    // vs writeGraphValues(graph)
    const header = json.MTConnectDevices.Header
    let { instanceId } = header

    //------------------------------------------------------------------------
    // current
    // get last known values of all dataitems, write to db
    //------------------------------------------------------------------------
    current: do {
      console.log(`Getting current data...`)
      const json = await getCurrent(client)
      if (!json) {
        console.log(`No data available - will wait and try again...`)
        await sleep(4000)
        break current
      }
      const header = json.MTConnectDevices.Header
      if (header.instanceId !== instanceId) {
        console.log(`InstanceId changed - falling back to probe...`)
        instanceId = header.instanceId
        break probe
      }

      //------------------------------------------------------------------------
      // sample
      // get sequence of dataitem values, write to db
      //------------------------------------------------------------------------
      sample: do {
        const json = await getSample(client)
        if (!json) {
          console.log(`No data available - will wait and try again...`)
          await sleep(4000)
          break sample
        }
        const header = json.MTConnectDevices.Header
        if (header.instanceId !== instanceId) {
          console.log(`InstanceId changed - falling back to probe...`)
          instanceId = header.instanceId
          break probe
        }
        await sleep(fetchInterval)
      } while (true)
    } while (true)
  } while (true)
}

main()

async function connect() {
  const pool = new Pool()
  let client
  do {
    try {
      console.log(`Trying to connect to db...`)
      client = await pool.connect() // uses envars PGHOST, PGPORT etc
    } catch (error) {
      console.log(`Error - will sleep before retrying...`)
      console.log(error)
      await sleep(4000)
    }
  } while (!client)
  return client
}

function handleSignals(client) {
  //. need init:true in compose yaml? nowork - how do?
  process
    .on('SIGTERM', getShutdown('SIGTERM'))
    .on('SIGINT', getShutdown('SIGINT'))

  // get shutdown handler
  function getShutdown(signal) {
    return error => {
      console.log()
      console.log(`Signal ${signal} received - shutting down...`)
      if (error) console.error(error.stack || error)
      if (!client) {
        console.log(`Releasing db client...`)
        client.release()
      }
      process.exit(error ? 1 : 0)
    }
  }
}

async function setupTables(client) {
  const sql = `
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

CREATE TABLE IF NOT EXISTS nodes (
  _id integer NOT NULL,
  props jsonb
);

CREATE TABLE IF NOT EXISTS edges (
  _from integer NOT NULL,
  _to integer NOT NULL,
  props jsonb
);

CREATE TABLE IF NOT EXISTS history (
  _id integer NOT NULL,
  time timestamptz NOT NULL,
  value jsonb
);

SELECT create_hypertable('history', 'time', if_not_exists => TRUE);

-- float is an alias for 'double precision'
-- .will want to join with nodes table to get props.path, eh?
-- CREATE OR REPLACE VIEW history_float
-- AS SELECT time, _id, value::float
-- FROM history
-- WHERE jsonb_typeof(value) = 'number'::text;
`
  console.log(`Creating db structures if not there...`)
  await client.query(sql)
}

// async function getProbe(client) {
//   const json = await getData('probe')
//   //. get all elements and their relations
//   const graph = getGraph(json)
//   console.log(graph)
//   //. add all to nodes and edges tables
//   // writeGraph(graph)
//   writeGraphStructure(graph)
//   return json
// }

// async function getCurrent(client) {
//   const json = await getData('current')
//   // // get sequence info from header?
//   // const { firstSequence, nextSequence, lastSequence } =
//   //   json.MTConnectStreams.Header
//   // from = nextSequence
//   // const dataItems = getDataItems(json)
//   // await writeDataItems(dataItems, client)
//   return json
// }

async function getSample(client) {
  let from = null
  let count = fetchCount
  // let next = null

  let json = await getData('sample', from, count)

  // check for errors
  // eg <Error errorCode="OUT_OF_RANGE">'from' must be greater than 647331</Error>
  if (json.MTConnectError) {
    console.log(json)
    const errorCodes = json.MTConnectError.Errors.map(e => e.Error.errorCode)
    if (errorCodes.includes('OUT_OF_RANGE')) {
      // we lost some data, so reset the index and get from start of buffer
      console.log(
        `Out of range error - some data was lost. Will reset index and get from start of buffer.`
      )
      from = null
      json = await getData('sample', from, count)
    }
  }

  // get sequence info from header
  const header = json.MTConnectStreams.Header
  const { firstSequence, nextSequence, lastSequence } = header
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
  return json
}

// traverse the json tree and return all elements and relations
function getElements(json) {
  const allElements = []
  logic.traverse(json, elements => {
    allElements.push(...elements)
  })
  return allElements
}

// traverse the json tree and return all data items
function getDataItems(json) {
  const allDataItems = []
  logic.traverse(json, dataItems => {
    allDataItems.push(...dataItems)
  })
  return allDataItems
}

function get_id(dataItemId) {
  return 1
}

// gather up all items into array, then put all into one INSERT stmt, for speed.
// otherwise pipeline couldn't keep up.
// see https://stackoverflow.com/a/63167970/243392 etc
async function writeDataItems(dataItems, client) {
  let rows = []
  for (const dataItem of dataItems) {
    let { dataItemId, timestamp, value } = dataItem
    const id = dataItemId
    const _id = get_id(id)
    value = value === undefined ? 'undefined' : value
    if (typeof value !== 'object') {
      const type = typeof value === 'string' ? 'text' : 'float'
      const row = `('${_id}', '${timestamp}', to_jsonb('${value}'::${type}))`
      rows.push(row)
    }
  }
  if (rows.length > 0) {
    const values = rows.join(',\n')
    const sql = `INSERT INTO history (_id, time, value) VALUES ${values};`
    console.log(sql)
    //. add try catch block - ignore error? just print it?
    await client.query(sql)
  }
}

// get json data from agent rest endpoint.
// type is 'probe', 'current', or 'sample'.
// from and count are optional.
async function getData(type, from, count) {
  const url =
    from === undefined
      ? `${baseUrl}/${type}`
      : `${baseUrl}/${type}?${
          from !== null ? 'from=' + from + '&' : ''
        }count=${count}`

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

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
