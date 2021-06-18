// mtconnect application
// capture data from mtconnect agent(s) and write to database

import { Db } from './db.js'
import { Agent } from './agent.js'
import { Endpoint } from './endpoint.js'
import { Graph } from './graph.js'
import * as libapp from './libapp.js'

console.log(`MTConnect Application starting`)
console.log(`---------------------------------------------------`)

// get envars
const params = {
  // AGENT_URLS can be a single url, a comma-delim list of urls, or a txt filename with urls
  agentEndpoints: process.env.AGENT_ENDPOINTS || 'http://localhost:5000',
  fetchInterval: Number(process.env.FETCH_INTERVAL || 2000), // how often to fetch sample data, msec
  fetchCount: Number(process.env.FETCH_COUNT || 800), // how many samples to fetch each time
  retryTime: 4000, // ms between connection retries etc
}

class Application {
  async start(params) {
    // get database
    const db = new Db()
    await db.start()

    // get db graph - nodes and edges
    const graphDb = await db.getGraph(Graph)
    libapp.print(graphDb)

    // get endpoints
    const endpoints = Endpoint.getEndpoints(params.agentEndpoints)
    console.log(`Agent endpoints:`, endpoints)

    // get agents
    const agents = endpoints.map(
      endpoint => new Agent({ db, endpoint, params })
    )

    // run agents
    // node is single threaded with an event loop,
    // so these agent 'threads' shouldn't clobber each other
    for (const agent of agents) {
      agent.start()
    }
  }
}

const application = new Application()
application.start(params)
