// ladder99 meter
// read data from database, calculate metrics, and write to db

import { Db } from './common/db.js'
import { Schedule } from './schedule.js'
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
  for (let agent of agents) {
    const devices = agent.devices ?? [] // [{ id, alias, ... }, ...]
    //
    for (let device of devices) {
      device.path = `${agent.alias}/${device.alias}` // eg 'Mazak5701/Mill12345

      // start getting schedule for this device -
      // but only if schedule defined for meters,
      // and if meters array defined for this device.
      let schedule = {}
      if (meters.schedule && device.meters) {
        schedule = new Schedule()
        await schedule.start({ db, meters, client, device }) // note the await
      }

      // iterate over meters for this device
      // meterKey is eg 'availability', 'good'
      // driver is eg 'availability', 'bin'
      for (let meterKey of device.meters ?? []) {
        const meter = meters[meterKey]
        const { driver } = meter // eg 'availability'
        const me = `Meter ${device.path} ${meterKey} ${driver}:`

        // import and instantiate driver
        const pathDriver = `${driversFolder}/${driver}.js` // eg './drivers/availability.js'
        // console.log(me, `importing ${pathDriver}...`)
        const { Metric } = await import(pathDriver)
        const plugin = new Metric()

        // start it up - poll db as needed
        console.log(me, `starting driver...`)
        meter.key = meterKey // eg 'availability', 'good'
        plugin.start({ db, schedule, client, device, meter }) // don't await here
      }
    }
  }
}

start()
