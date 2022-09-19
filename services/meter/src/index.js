// ladder99 meter
// read data from database, calculate metrics, and write to db

import { Db } from './common/db.js'
import * as lib from './common/lib.js'

console.log()
console.log(`Ladder99 Meter`)
console.log(`Read data from database, calculate metrics, write to db`)
console.log(`--------------------------------------------------------------`)

const metricsFolder = './metrics'
const setupFolder = process.env.L99_SETUP_FOLDER || `/data/setup`

async function start() {
  //
  // get database connection
  console.log(`Meter - connecting to db...`)
  const db = new Db()
  await db.start()

  // read client's setup.yaml
  console.log(`Meter - reading client setup.yaml...`)
  const setup = lib.readSetup(setupFolder)
  const client = setup.client || {}
  const meter = setup.meter || {}
  const defaults = meter.defaults || {} // default meter settings
  const meterKeys = Object.keys(defaults) // list of meter keys, eg ['availability', ...]
  const overrides = meter.overrides || {} // overrides per device

  // iterate over agents and their devices, as specified in relay section
  const agents = setup.relay || [] // list of agents, each with list of devices
  for (let agent of agents) {
    const devices = agent.devices || []
    for (let device of devices) {
      for (let meterKey of meterKeys) {
        const settings = { ...defaults[meterKey], ...overrides[device.id] } //. .id? alias?

        // import metric plugin
        const pathMetric = `${metricsFolder}/${meterKey}.js` // eg './metrics/availability.js'
        console.log(`Meter - importing ${pathMetric}...`)
        const { Metric } = await import(pathMetric)
        const plugin = new Metric()

        // start it
        console.log(`Meter - starting ${device.alias} ${meterKey}...`)
        // plugin.start({ client, db, device, metric })
        plugin.start({ client, db, device, settings })
      }
    }
  }

  // // iterate over devices, check what metrics they want, if any,
  // // load those metric plugins, start them up - let them poll db as needed etc.
  // for (let device of setup.meter?.devices || []) {
  //   const metrics = device.metrics || []
  //   for (let metric of metrics) {
  //     const { name } = metric

  //     // import metric plugin
  //     const pathMetric = `${metricsFolder}/${name}.js` // eg './metrics/availability.js'
  //     console.log(`Meter - importing ${pathMetric}...`)
  //     const { Metric } = await import(pathMetric)
  //     const plugin = new Metric()

  //     // start it
  //     console.log(`Meter - starting ${device.name} ${metric.name}...`)
  //     plugin.start({ client, db, device, metric })
  //   }
  // }
}

start()
