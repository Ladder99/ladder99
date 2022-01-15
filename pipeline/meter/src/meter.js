// ladder99 meter
// read data from database, calculate metrics, and write to db

import { Db } from './db.js'
// import * as lib from './lib.js'

console.log(`Ladder99 Meter`)
console.log(`---------------------------------------------------`)

// defined in pipeline.yaml with docker volume mappings
const setupFolder = '/data/setup' // incls setup.yaml etc

class Relay {
  async start(params) {
    // get database, do migrations
    const db = new Db()
    await db.start()

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
