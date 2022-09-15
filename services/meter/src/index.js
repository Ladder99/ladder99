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
  // get database connection
  console.log(`Meter - connecting to db...`)
  const db = new Db()
  await db.start()
  console.log(`Meter - connected`)

  // read client's setup.yaml
  console.log(`Meter - reading client setup yaml...`)
  const setup = lib.readSetup(setupFolder)
  const client = setup.client || {} // has { name, timezone }

  const defaultMetrics = setup?.adapter?.metrics || {} // eg { availability, count, ... }
  console.log(`Meter - default metrics`, defaultMetrics)

  // iterate over devices, check what metrics they want, if any,
  // load those metric plugins, start them up - let them poll db as needed etc.
  for (let device of setup.devices || []) {
    // const metrics = device.metrics || []
    const metrics = { ...defaultMetrics, ...device.metrics }
    console.log(`Meter - device metrics`, device.id, metrics)
    for (let name of Object.keys(metrics)) {
      const metric = metrics[name]

      // import metric plugin
      const pathMetric = `${metricsFolder}/${name}.js` // eg './metrics/availability.js'
      console.log(`Meter - importing ${pathMetric}...`)
      const { Metric } = await import(pathMetric)
      const plugin = new Metric()

      // start it
      console.log(`Meter - starting ${device.name} ${name}...`)
      plugin.start({ client, db, device, metric })
    }
  }
}

start()
