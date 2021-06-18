// mtconnect application
// capture agent data and write to database

import fetch from 'node-fetch'
import * as logic from './logic.js'
import * as libapp from './libapp.js'
import { Db } from './db.js'
import { Agent } from './agent.js'
import { Endpoint } from './endpoint.js'

console.log(`MTConnect Application starting`)
console.log(`---------------------------------------------------`)

// get envars
//. put in params obj?
const endpointsStr = process.env.AGENT_ENDPOINTS || 'http://localhost:5000'
const fetchInterval = Number(process.env.FETCH_INTERVAL || 2000) // how often to fetch sample data, msec
const fetchCount = Number(process.env.FETCH_COUNT || 800) // how many samples to fetch each time
const retryTime = 4000 // ms between connection retries etc

class Application {
  constructor() {
    const endpoints = Endpoint.getEndpoints(endpointsStr)
    console.log(`Agent endpoints:`, endpoints)
    this.agents = endpoints.map(endpoint => new Agent(endpoint, db))
    this.db = null
  }

  async connect() {
    this.db = new Db()
    await this.db.start()
  }

  async start() {
    this.db = await this.connect()
    //. could this mess up db? weird race conditions? i think it'll be okay
    for (const agent of this.agents) {
      agent.start(this.db)
    }
  }
}

const application = new Application()
application.start()

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
