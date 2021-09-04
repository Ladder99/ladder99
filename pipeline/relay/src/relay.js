// ladder99 relay
// capture data from ladder99 agent(s) and write to database

import { Db } from './db.js'
import { AgentReader } from './agentReader.js'
import { Endpoint } from './endpoint.js'

console.log(`MTConnect Relay starting`)
console.log(`---------------------------------------------------`)

// get envars - typically set in pipeline.yaml and pipeline-overrides.yaml files
const params = {
  // AGENT_URLS can be a single url, a comma-delim list of urls, or a txt filename with urls.
  // currently set in pipeline-overrides.yaml, but
  //. eventually will read from setup.xml
  agentEndpoints: process.env.AGENT_ENDPOINTS || 'http://localhost:5000',
  //. these will need to be dynamic - adjusted on the fly
  fetchInterval: Number(process.env.FETCH_INTERVAL || 2000), // how often to fetch sample data, msec
  fetchCount: Number(process.env.FETCH_COUNT || 800), // how many samples to fetch each time
  retryTime: 4000, // ms between connection retries etc
}

class Application {
  async start(params) {
    // get database, do migrations
    const db = new Db()
    await db.start()

    // get endpoints
    const endpoints = Endpoint.getEndpoints(params.agentEndpoints)
    console.log(`Agent endpoints:`, endpoints)

    // create an agent reader instance for each endpoint
    const agentReaders = endpoints.map(
      endpoint => new AgentReader({ db, endpoint, params })
    )

    // run agent readers
    // node is single threaded with an event loop
    // run in parallel so agent readers run independently of each other
    for (const agentReader of agentReaders) {
      agentReader.start()
    }
  }
}

const application = new Application()
application.start(params)
