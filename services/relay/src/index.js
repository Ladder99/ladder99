// ladder99 relay
// capture data from ladder99 agent(s) and write to database

import { Db } from './common/db.js'
import { migrate } from './migrations/migrate.js'
import { AgentReader } from './agentReader.js'
import { Endpoint } from './endpoint.js'
import { Autoprune } from './autoprune.js'
import * as lib from './common/lib.js'
import { params } from './params.js'

console.log()
console.log(`Ladder99 Relay`)
console.log(new Date().toISOString())
console.log(`---------------------------------------------------`)

async function start(params) {
  //
  // get database connection
  const db = new Db()
  await db.start()

  // run migrations (setup db tables and views etc)
  await migrate(db)

  // read client's setup.yaml (includes devices, where to find their agents etc)
  const setup = lib.readSetup(params.setupFolder)

  // get array of agent objects from setup yaml. each has { alias, url, devices, ... }
  const agents = setup?.relay?.agents || [params.defaultAgent]

  for (let agent of agents) {
    //
    // remove any trailing slash from base urls
    if (agent.url.endsWith('/')) {
      agent.url = agent.url.slice(0, agent.url.length - 1)
    }

    // get endpoint object, which points to mtconnect agent
    const endpoint = new Endpoint(agent.url)
    console.log(`Agent endpoint:`, endpoint)

    // get agent reader, which will read and process data from endpoint
    const agentReader = new AgentReader({ params, db, endpoint, setup, agent })

    // run agent readers (read mtconnect agent xml, write SQL to database).
    // nodejs is single threaded with an event loop -
    // run in parallel so agent readers run independently of each other.
    agentReader.start()
  }

  // start the autoprune scheduler
  const autoprune = new Autoprune(params, db, setup)
  autoprune.start()
}

start(params)
