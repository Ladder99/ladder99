// adapter
// poll or subscribe to data via plugins, update cache,
// update shdr strings, pass them to agent via tcp.

import { Adapter } from './adapter.js'

console.log()
console.log(`Ladder99 Adapter`)
console.log(`Polls/subscribes to data, writes to cache, transforms to SHDR,`)
console.log(`posts to Agent via TCP.`)
console.log(new Date().toISOString())
console.log(`----------------------------------------------------------------`)

const params = {
  // default tcp server for agent if none provided in setup.yaml
  defaultAgent: { protocol: 'shdr', host: 'adapter', port: 7878 },
  // folders like /data/schemas are defined in docker-compose.yaml with docker volume mappings.
  driversFolder: './drivers', // eg for mqttSubscriber.js - must start with '.' - relative to src dir
  //. do this for custom drivers
  // driverFolders: [
  //   process.env.L99_DRIVER_FOLDER || `/data/drivers`,
  //   './drivers', // relative to src dir
  // ],
  setupFolder: process.env.L99_SETUP_FOLDER || `/data/setup`, // includes setup.yaml
  // schemasFolder: process.env.L99_SCHEMA_FOLDER || `/data/schemas`, // incls hosts/inputs.yaml etc
  // schemasFolder: 'src/schemas', // incls host/inputs.yaml etc - relative to services/adapter dir
  // schemasFolder:
  //   process.env.L99_ADAPTER_FOLDER + '/schemas' || `/data/adapter/schemas`, // incls host/inputs.yaml etc
  // folders to search for schemas, in order. eg includes hosts/inputs.yaml etc
  schemaFolders: [
    process.env.L99_SCHEMA_FOLDER || `/data/schemas`,
    'src/schemas', // relative to ladder99/services/adapter dir
  ],
}

const adapter = new Adapter()
adapter.start(params)

function signalHandler() {
  adapter.stop() //. do await?
  process.exit()
}

process.on('SIGINT', signalHandler)
process.on('SIGTERM', signalHandler)
process.on('SIGQUIT', signalHandler)
