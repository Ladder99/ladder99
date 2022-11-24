// adapter
// poll or subscribe to data via plugins, update cache,
// update shdr strings, pass them to agent via tcp.

import * as lib from './common/lib.js'
import { Cache } from './cache.js'
import { setupDevice } from './setupDevice.js'
import { getPlugin } from './helpers.js'

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

async function start(params) {
  //
  // read client setup.yaml file
  const setup = lib.readSetup(params.setupFolder)

  // define cache shared across all devices and sources
  const cache = new Cache()

  // load any shared providers
  // eg setup.yaml/adapter/providers = { sharedMqtt: { driver, url }, ... }
  const providers = setup.adapter?.providers || {}
  for (const provider of Object.values(providers)) {
    console.log(`Adapter get shared provider`, provider)
    // import driver plugin - instantiates a new instance of the AdapterDriver class
    const plugin = await getPlugin(params.driversFolder, provider.driver) // eg 'mqttProvider'
    // AWAIT here until provider is connected?
    plugin.start({ provider }) // start driver - eg this connects to the mqtt broker
    // await plugin.start({ provider }) // start driver - eg this connects to the mqtt broker
    provider.plugin = plugin // save plugin to this provider object, eg { driver, url, plugin }
  }

  // iterate over device definitions from setup.yaml file and do setup for each
  const client = setup.client || {}
  // const devices = setup.devices || [] //. develop branch
  const devices = setup?.adapter?.devices || [] //. historian branch - careful with merge here
  for (const device of devices) {
    setupDevice({ setup, params, device, cache, client, devices, providers })
  }
}

start(params)
