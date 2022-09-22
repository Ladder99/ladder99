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
  const overrides = meter.overrides || {} // overrides per device

  // iterate over agents and their devices, as specified in RELAY section.
  //. alternative would be to repeat agents and devices in meter section.
  const agents = (setup.relay || {}).agents || [] // list of agents, each with list of devices
  for (let agent of agents) {
    const devices = agent.devices || [] // [{ id, alias, ... }, ...]
    for (let device of devices) {
      device.path = `${agent.alias}/${device.alias}` // eg 'Mazak5701/Mill12345
      const meterKeys = Object.keys(defaults) // list of meters, eg ['availability', 'count', ...]
      for (let meterKey of meterKeys) {
        const defaultSettings = defaults[meterKey] || {} // eg { activePath, ... }
        const overrideSettings = overrides[device.path] || {} // eg { ignore: true }
        const settings = { ...defaultSettings, ...overrideSettings }
        const { ignore } = settings
        if (ignore) continue // don't run this meter for this device

        // import metric plugin
        const pathMetric = `${metricsFolder}/${meterKey}.js` // eg './metrics/availability.js'
        console.log(`Meter ${device.path} importing ${pathMetric}...`)
        const { Metric } = await import(pathMetric)
        const plugin = new Metric()

        // start it up - poll db as needed
        console.log(`Meter ${device.path} starting ${meterKey}...`)
        plugin.start({ client, db, device, settings })
      }
    }
  }
}

start()
