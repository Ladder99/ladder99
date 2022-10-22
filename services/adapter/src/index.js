// adapter
// polls or subscribes to data via plugins, updates cache,
// updates shdr strings, passes them to agent via tcp.

import * as lib from './common/lib.js'
import { Cache } from './cache.js'
import { setupDevice } from './setup.js'

console.log()
console.log(`Ladder99 Adapter`)
console.log(`Polls/subscribes to data, writes to cache, transforms to SHDR, `)
console.log(`posts to MTConnect Agent over TCP.`)
console.log(new Date().toISOString())
console.log(`----------------------------------------------------------------`)

const params = {
  // file system inputs
  // when adapter.js is run, it expects config in /data/setup and /data/models.
  // data/setup includes setup.yaml, which includes a list of devices to setup.
  // these folders may be defined in compose.yaml with docker volume mappings,
  // or overridden in compose-overrides.yaml.
  setupFolder: process.env.L99_SETUP_FOLDER || `/data/setup`,

  modulesFolder: process.env.L99_MODULES_FOLDER || `/data/modules`, // incls print-apply/module.xml etc
  // commonModulesFolder:
  //   process.env.L99_COMMON_MODULES_FOLDER || `/data/modules/common`,
  // setupModulesFolder:
  //   process.env.L99_SETUP_MODULES_FOLDER || `/data/modules/setup`,

  driversFolder: './drivers', // eg for micro.js - must start with '.'

  // default tcp server for agent to connect to - used if none provided in setup.yaml
  defaultServer: { protocol: 'shdr', host: 'adapter', port: 7878 },
}

async function start(params) {
  // read client setup.yaml file
  const setup = lib.readSetup(params.setupFolder)

  // define cache shared across all devices and sources
  const cache = new Cache()

  // iterate over device definitions from setup.yaml file and do setup for each
  const client = setup.client || {}
  const devices = setup?.adapter?.devices || []
  for (const device of devices) {
    setupDevice({ params, device, cache, client, devices })
  }
}

start(params)
