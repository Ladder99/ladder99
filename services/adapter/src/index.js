// adapter
// poll or subscribe to data via plugins, update cache,
// update shdr strings, pass them to agent via tcp.

import * as lib from './common/lib.js'
import { Cache } from './cache.js'
import { setupDevice } from './setupDevice.js'

console.log()
console.log(`Ladder99 Adapter`)
console.log(`Polls/subscribes to data, writes to cache, transforms to SHDR,`)
console.log(`posts to Agent via TCP.`)
console.log(new Date().toISOString())
console.log(`----------------------------------------------------------------`)

// get params - typically set in compose.yaml and compose-overrides.yaml files
const params = {
  // default tcp server for agent if none provided in setup.yaml
  defaultServer: { protocol: 'shdr', host: 'adapter', port: 7878 },
  // file system inputs
  driversFolder: './drivers', // eg mqtt-json - must start with '.'
  // these folders may be defined in compose.yaml with docker volume mappings.
  // when adapter.js is run, it expects config in /data/setup and /data/models.
  // /data/setup includes setup.yaml, which includes a list of devices to setup.
  setupFolder: process.env.L99_SETUP_FOLDER || `/data/setup`,
  modulesFolder: process.env.L99_MODULES_FOLDER || `/data/modules`, // incls print-apply/module.xml etc
}

async function start(params) {
  //
  // read client setup.yaml file
  const setup = lib.readSetup(params.setupFolder)

  // define cache shared across all devices and sources
  const cache = new Cache()

  // iterate over device definitions from setup.yaml file and do setup for each
  const client = setup.client || {}
  const devices = setup.devices || []
  for (const device of devices) {
    setupDevice({ params, device, cache, client, devices })
  }
}

start(params)
