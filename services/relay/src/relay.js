// ladder99 relay
// capture data from ladder99 agent(s) and write to database

import { Db } from './db.js'
import { migrate } from './migrations/migrate.js'
import { AgentReader } from './agentReader.js'
import { Endpoint } from './endpoint.js'
import * as lib from './lib.js'

// defined in compose.yaml with docker volume mappings
const setupFolder = process.env.L99_SETUP_FOLDER || '/data/setup'

console.log()
console.log(`Ladder99 Relay`)
console.log(`---------------------------------------------------`)

// get envars - typically set in compose.yaml and compose-overrides.yaml files
const params = {
  // AGENT_URLS can be a single url, a comma-delim list of urls, or a txt filename with urls.
  // these are the agents we'll be reading from.
  // currently set in compose-overrides.yaml, but
  //. eventually will read from setup.xml or setup.yaml - could be per device and/or defaults
  agentEndpoints: process.env.AGENT_ENDPOINTS || 'http://localhost:5000',
  //. these will need to be dynamic - adjusted on the fly
  fetchInterval: Number(process.env.FETCH_INTERVAL || 2000), // how often to fetch sample data, msec
  fetchCount: Number(process.env.FETCH_COUNT || 800), // how many samples to fetch each time
  retryTime: 4000, // ms between connection retries etc
}

class Relay {
  async start(params) {
    // get database connection
    const db = new Db()
    await db.start()

    // do migrations
    await migrate(db)

    // read client's setup.yaml
    const setup = lib.readSetup(setupFolder)

    // get endpoints
    const endpoints = Endpoint.getEndpoints(params.agentEndpoints)
    console.log(`Agent endpoints:`, endpoints)

    // create an agent reader instance for each endpoint
    const agentReaders = endpoints.map(
      endpoint => new AgentReader({ db, endpoint, params, setup })
    )

    // run agent readers
    // node is single threaded with an event loop
    // run in parallel so agent readers run independently of each other
    for (const agentReader of agentReaders) {
      agentReader.start()
    }
  }
}

const relay = new Relay()
relay.start(params)
