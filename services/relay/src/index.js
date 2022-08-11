// ladder99 relay
// capture data from ladder99 agent(s) and write to database

import { Db } from './common/db.js'
import { migrate } from './migrations/migrate.js'
import { AgentReader } from './agentReader.js'
import { Endpoint } from './endpoint.js'
import * as lib from './common/lib.js'

// defined in compose.yaml with docker volume mappings
//. move into params below
const setupFolder = process.env.L99_SETUP_FOLDER || '/data/setup'

console.log()
console.log(`Ladder99 Relay`)
console.log(new Date().toISOString())
console.log(`---------------------------------------------------`)

// get envars - typically set in compose.yaml and compose-overrides.yaml files
const params = {
  retryTime: 4000, // ms between connection retries etc
  // these are dynamic - adjusted on the fly
  fetchInterval: Number(process.env.FETCH_INTERVAL || 2000), // how often to fetch sample data, msec
  fetchCount: Number(process.env.FETCH_COUNT || 800), // how many samples to fetch each time
}

async function start(params) {
  // get database connection
  const db = new Db()
  await db.start()

  // do migrations (setup db tables and views etc)
  await migrate(db)

  // read client's setup.yaml (includes devices, where to find their agents etc)
  const setup = lib.readSetup(setupFolder)

  // get endpoints (mtconnect agent urls)
  const endpoints = Endpoint.getEndpoints(setup) // static fn - see endpoint.js
  console.log(`Agent endpoints:`, endpoints)

  // create an agent reader instance for each agent/endpoint
  const agentReaders = endpoints.map(
    endpoint => new AgentReader({ db, endpoint, params, setup })
  )

  // run agent readers (read mtconnect agent xml, write SQL to database)
  // node is single threaded with an event loop -
  // run in parallel so agent readers run independently of each other.
  for (const agentReader of agentReaders) {
    agentReader.start()
  }
}

start(params)
