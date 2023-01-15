// ladder99 meter
// read data from database, calculate metrics, and write to db

import { Db } from './common/db.js'
import * as lib from './common/lib.js'

console.log()
console.log(`Ladder99 Meter`)
console.log(`Read data from database, calculate metrics, write to db`)
console.log(`--------------------------------------------------------------`)

const driversFolder = './drivers'
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
  const client = setup.client ?? {}

  // read relay section
  const agents = (setup.relay ?? {}).agents ?? [] // list of agents, each with list of devices

  // read meters section
  const meters = setup.meters ?? {}

  // iterate over agents and their devices, as specified in RELAY section.
  //. alternative would be to repeat agents and devices in meters section.
  for (let agent of agents) {
    const devices = agent.devices ?? [] // [{ id, alias, ... }, ...]
    //
    for (let device of devices) {
      device.path = `${agent.alias}/${device.alias}` // eg 'Mazak5701/Mill12345
      //
      for (let meterKey of device.meters ?? []) {
        const meter = meters[meterKey]
        console.log(`Meter ${device.path} loading ${meterKey}...`)
        const { driver } = meter

        // import and instantiate driver
        const pathMetric = `${driversFolder}/${driver}.js` // eg './metrics/availability.js'
        console.log(`Meter ${device.path} importing ${pathMetric}...`)
        const { Metric } = await import(pathMetric)
        const plugin = new Metric()

        // start it up - poll db as needed
        console.log(`Meter ${device.path} starting ${driver} driver...`)
        meter.name = meterKey
        plugin.start({ client, db, device, meter })
      }
    }
  }
}

start()
