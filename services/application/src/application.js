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

// get array of agent urls
// AGENT_URLS can be a single url, a comma-delim list of urls, or a txt filename with urls
const agentUrlsStr = process.env.AGENT_URLS || 'http://localhost:5000'
let agentUrls = []
if (agentUrlsStr.includes(',')) {
  agentUrls = agentUrlsStr.split(',')
} else if (agentUrlsStr.endsWith('.txt')) {
  const s = String(fs.readFileSync(agentUrlsStr)).trim()
  agentUrls = s.split('\n')
} else {
  agentUrls = [agentUrlsStr]
}

//. these will be dynamic - optimize on the fly
let fetchInterval = Number(process.env.FETCH_INTERVAL || 2000) // how often to fetch sample data, msec
let fetchCount = Number(process.env.FETCH_COUNT || 800) // how many samples to fetch each time

// init dicts
const sequenceDicts = {}
const idDicts = {}
for (const agentUrl of agentUrls) {
  sequenceDicts[agentUrl] = { from: null }
  idDicts[agentUrl] = {}
}

const retryTime = 4000 // ms between connection retries etc

main(agentUrls)

async function main(agentUrls) {
  const db = await getDb() // get postgres db connection
  handleSignals(db) // handle ctrl-c etc
  await setupTables(db) // setup tables and views
  //. could db get screwed up with this? weird race conditions?
  for (const agentUrl of agentUrls) {
    handleAgent(db, agentUrl)
  }
}

// start a 'thread' to handle data from the given base agent url
async function handleAgent(db, agentUrl) {
  const sequences = sequenceDicts[agentUrl]

  // get device structures and write to db
  probe: do {
    const json = await getAgentData(agentUrl, 'probe')
    if (await noAgentData(json)) break probe
    const instanceId = getInstanceId(json)
    await handleProbe(db, json)

    // get last known values of all dataitems, write to db
    current: do {
      const json = await getAgentData(agentUrl, 'current')
      if (await noAgentData(json)) break current
      if (instanceIdChanged(json, instanceId)) break probe
      await handleCurrent(db, json, sequences)

      // get sequence of dataitem values, write to db
      sample: do {
        // const json = await getSample(agentUrl, sequences)
        // if (await noAgentData(json)) break sample
        // if (instanceIdChanged(json, instanceId)) break probe
        // await handleSample(db, json, sequences)
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

async function getDb() {
  const pool = new Pool()
  let db
  do {
    try {
      console.log(`Trying to connect to db...`)
      db = await pool.connect() // uses envars PGHOST, PGPORT etc
    } catch (error) {
      console.log(`Error - will sleep before retrying...`)
      console.log(error)
      await sleep(retryTime)
    }
  } while (!db)
  return db
}

function handleSignals(db) {
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
      if (!db) {
        console.log(`Releasing db db...`)
        db.release()
      }
      process.exit(error ? 1 : 0)
    }
  }
}

async function setupTables(db) {
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
  await db.query(sql)
}

// type is 'probe' or 'current'
async function getAgentData(agentUrl, type) {
  const url = getUrl(agentUrl, type)
  const json = await fetchJsonData(url)
  return json
}

async function noAgentData(json) {
  if (!json) {
    console.log(`No data available - will wait and try again...`)
    await sleep(retryTime)
    return true
  }
  return false
}

async function handleProbe(db, json) {
  const graph = getGraph(json)
  await writeGraphStructure(db, graph)
}

async function handleCurrent(db, json, sequences) {
  // // get sequence info from header?
  // const { firstSequence, nextSequence, lastSequence } =
  //   json.MTConnectStreams.Header
  // from = nextSequence
  // const dataItems = getDataItems(json)
  // await writeDataItems(db, dataItems)
  // await writeGraphValues(db, graph)
}

async function getSample(agentUrl, sequences) {
  sequences.from = null
  sequences.count = fetchCount
  let json
  do {
    const url = getUrl(agentUrl, 'sample', sequences.from, sequences.count)
    json = await getAgentData(url)
    // check for errors
    // eg <Error errorCode="OUT_OF_RANGE">'from' must be greater than 647331</Error>
    if (json.MTConnectError) {
      console.log(json)
      const codes = json.MTConnectError.Errors.map(e => e.Error.errorCode)
      if (codes.includes('OUT_OF_RANGE')) {
        // we lost some data, so reset the index and get from start of buffer
        console.log(
          `Out of range error - some data was lost. Will reset index and get as much as possible from start of buffer.`
        )
        sequences.from = null
        //. adjust fetch count/speed
      }
    }
  } while (json.MTConnectError)
  return json
}

async function handleSample(db, json, sequences) {
  // get sequence info from header
  const header = json.MTConnectStreams.Header
  const { firstSequence, nextSequence, lastSequence } = header
  sequences.from = nextSequence

  const dataItems = getDataItems(json)
  await writeDataItems(db, dataItems)

  // //. if gap, fetch and write that also
  // const gap = false
  // if (gap) {
  //   const json = await getAgentData('sample', sequences.from, sequences.count)
  //   const dataItems = getDataItems(json)
  //   await writeDataItems(db, dataItems)
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

// gather up all items into array, then put all into one INSERT stmt, for speed.
// otherwise pipeline couldn't keep up.
// see https://stackoverflow.com/a/63167970/243392 etc
async function writeDataItems(db, dataItems, idMap) {
  let rows = []
  for (const dataItem of dataItems) {
    let { dataItemId, timestamp, value } = dataItem
    const id = dataItemId
    const _id = idMap[id]
    if (_id) {
      value = value === undefined ? 'undefined' : value
      if (typeof value !== 'object') {
        const type = typeof value === 'string' ? 'text' : 'float'
        const row = `('${_id}', '${timestamp}', to_jsonb('${value}'::${type}))`
        rows.push(row)
      } else {
        //. handle arrays
        console.log(`**Handle arrays for '${id}'.`)
      }
    } else {
      console.log(`Unknown element id '${id}', value '${value}'.`)
    }
  }
  if (rows.length > 0) {
    const values = rows.join(',\n')
    const sql = `INSERT INTO history (_id, time, value) VALUES ${values};`
    console.log(sql)
    //. add try catch block - ignore error? or just print it?
    await db.query(sql)
  }
}

// type is 'probe', 'current', or 'sample'.
// from and count are optional.
function getUrl(agentUrl, type, from, count) {
  const url =
    from === undefined
      ? `${agentUrl}/${type}`
      : `${agentUrl}/${type}?${
          from !== null ? 'from=' + from + '&' : ''
        }count=${count}`
  return url
}

// get json data from agent rest endpoint
async function fetchJsonData(url) {
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
