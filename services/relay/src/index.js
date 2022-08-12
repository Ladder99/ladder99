// ladder99 relay
// capture data from ladder99 agent(s) and write to database

import { Db } from './common/db.js'
import { migrate } from './migrations/migrate.js'
import { AgentReader } from './agentReader.js'
import { Endpoint } from './endpoint.js'
import * as lib from './common/lib.js'

console.log()
console.log(`Ladder99 Relay`)
console.log(new Date().toISOString())
console.log(`---------------------------------------------------`)

// get envars - typically set in compose.yaml and compose-overrides.yaml files
const params = {
  retryTime: 4000, // ms between connection retries etc
  // this is the default ladder99 agent service - can override or specify others in setup.yaml.
  defaultAgents: [{ id: 'main', url: 'http://agent:5000' }], // don't change id!
  // hardcoded default folder is defined in compose.yaml with docker volume mappings
  setupFolder: process.env.L99_SETUP_FOLDER || '/data/setup',
  // these are dynamic - adjusted on the fly
  fetchInterval: Number(process.env.FETCH_INTERVAL || 2000), // how often to fetch sample data, msec
  fetchCount: Number(process.env.FETCH_COUNT || 800), // how many samples to fetch each time
}

async function start(params) {
  //
  // get database connection
  const db = new Db()
  await db.start()

  // do migrations (setup db tables and views etc)
  await migrate(db)

  // read client's setup.yaml (includes devices, where to find their agents etc)
  const setup = lib.readSetup(params.setupFolder)

  // get array of agent objects from setup yaml
  const agents = setup?.relay?.agents || params.defaultAgents

  // remove any trailing slash from base urls
  agents.forEach(agent => {
    if (agent.url.endsWith('/')) {
      agent.url = agent.url.slice(0, agent.url.length - 1)
    }
  })

  // get array of endpoint objects, which point to mtconnect agents
  const endpoints = agents.map(agent => new Endpoint(agent))
  console.log(`Agent endpoints:`, endpoints)

  // create an agent reader instance for each agent/endpoint
  const agentReaders = endpoints.map(
    endpoint => new AgentReader({ params, db, endpoint, setup })
  )

  // run agent readers (read mtconnect agent xml, write SQL to database).
  // nodejs is single threaded with an event loop -
  // run in parallel so agent readers run independently of each other.
  for (const agentReader of agentReaders) {
    agentReader.start()
  }
}

start(params)
