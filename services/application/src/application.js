// mtconnect application
// capture agent data and write to database

import fs from 'fs' // node lib
import fetch from 'node-fetch'
import pg from 'pg' // postgres driver
const { Pool } = pg // import { Client } from 'pg' gives error, so must do this
import * as logic from './logic.js'

console.log(`MTConnect Application starting`)
console.log(`---------------------------------------------------`)

// get envars
// agent urls can be a single url, a comma-delim list of urls, or a txt filename with urls
const agentUrls = process.env.AGENT_URLS || 'http://localhost:5000'
//. these should be dynamic - optimize on the fly
let fetchInterval = Number(process.env.FETCH_INTERVAL || 2000) // how often to fetch sample data, msec
let fetchCount = Number(process.env.FETCH_COUNT || 800) // how many samples to fetch each time
const retryTime = 4000 // ms between connection retries etc

// get array of base agent urls
let baseUrls
if (agentUrls.includes(',')) {
  baseUrls = agentUrls.split(',')
} else if (agentUrls.endsWith('.txt')) {
  const s = String(fs.readFileSync(agentUrls)).trim()
  baseUrls = s.split('\n')
} else {
  baseUrls = [agentUrls]
}

// init sequences dict
const sequences = {}
for (const baseUrl of baseUrls) {
  sequences[baseUrl] = {}
}

main(baseUrls)

async function main(baseUrls) {
  const client = await connect() // get postgres connection
  handleSignals(client) // handle ctrl-c etc
  await setupTables(client) // setup tables and views
  // call main once for each baseurl
  //. could db get screwed up though? weird race conditions?
  for (const baseUrl of baseUrls) {
    handleAgent(baseUrl, client)
  }
}

// start a 'thread' to handle data from the given base agent url
async function handleAgent(baseUrl, client) {
  // get device structures and write to db
  probe: do {
    console.log(`Getting probe data...`)
    const json = await getData(baseUrl, 'probe')
    if (noData(json)) break probe
    const instanceId = getInstanceId(json)
    await handleProbe(json, client)

    // get last known values of all dataitems, write to db
    current: do {
      console.log(`Getting current data...`)
      const json = await getData(baseUrl, 'current')
      if (noData(json)) break current
      if (instanceIdChanged(json, instanceId)) break probe
      await handleCurrent(json, client)

      // get sequence of dataitem values, write to db
      sample: do {
        //. need to maintain a dict of from, next, count, etc?
        // or getSample should maintain one - pass baseUrl to it as key of dict?
        const json = await getSample(baseUrl)
        if (!json) {
          console.log(`No data available - will wait and try again...`)
          await sleep(retryTime)
          break sample
        }
        if (instanceIdChanged(json, instanceId)) break probe
        await handleSample(json, client)
        await sleep(fetchInterval)
      } while (true)
    } while (true)
  } while (true)
}

function getInstanceId(json) {
  const header = json.MTConnectDevices.Header
  let { instanceId } = header
  return instanceId
}

function instanceIdChanged(json, instanceId) {
  const header = json.MTConnectDevices.Header
  if (header.instanceId !== instanceId) {
    console.log(`InstanceId changed - falling back to probe...`)
    return true
  }
  return false
}

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
      await sleep(retryTime)
    }
  } while (!client)
  return client
}

function handleSignals(client) {
  //. need init:true in compose yaml? nowork - how do?
  //. handle unhandled exception?
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

// type is 'probe' or 'current'
async function getData(baseUrl, type) {
  // let json
  // do {
  //   const url = getUrl(baseUrl, type)
  //   json = await fetchData(url)
  //   if (!json) {
  //     console.log(`No data available - will wait and try again...`)
  //     await sleep(retryTime)
  //   }
  // } while (!json)
  const url = getUrl(baseUrl, type)
  const json = await fetchData(url)
  return json
}

async function noData(json) {
  if (!json) {
    console.log(`No data available - will wait and try again...`)
    await sleep(retryTime)
    return true
  }
  return false
}

async function handleProbe(json, client) {
  //. get all elements and their relations
  // const graph = getGraph(json)
  // console.log(graph)
  //. add all to nodes and edges tables
  // writeGraph(graph)
  // writeGraphStructure(graph)
}

async function handleCurrent(json, client) {
  // // get sequence info from header?
  // const { firstSequence, nextSequence, lastSequence } =
  //   json.MTConnectStreams.Header
  // from = nextSequence
  // const dataItems = getDataItems(json)
  // await writeDataItems(dataItems, client)
}

async function getSample(baseUrl) {
  //. move these to dict - sequences
  let from = null
  let count = fetchCount
  // let next = null
  let json
  do {
    const url = getUrl(baseUrl, 'sample', from, count)
    json = await getData(url)
    // check for errors
    // eg <Error errorCode="OUT_OF_RANGE">'from' must be greater than 647331</Error>
    if (json.MTConnectError) {
      console.log(json)
      const errorCodes = json.MTConnectError.Errors.map(e => e.Error.errorCode)
      if (errorCodes.includes('OUT_OF_RANGE')) {
        // we lost some data, so reset the index and get from start of buffer
        console.log(
          `Out of range error - some data was lost. Will reset index and get as much as possible from start of buffer.`
        )
        from = null
        // const url = getUrl(baseUrl, 'sample', from, count)
        // json = await getData(url) //. check for errors here also
      }
    }
  } while (!json.MTConnectError)
  return json
}

async function handleSample(json, client) {
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
  return 1 //.
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

// type is 'probe', 'current', or 'sample'.
// from and count are optional.
function getUrl(baseUrl, type, from, count) {
  const url =
    from === undefined
      ? `${baseUrl}/${type}`
      : `${baseUrl}/${type}?${
          from !== null ? 'from=' + from + '&' : ''
        }count=${count}`
  return url
}

// get json data from agent rest endpoint
async function fetchData(url) {
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
