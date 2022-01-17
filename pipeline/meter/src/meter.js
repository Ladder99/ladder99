// ladder99 meter
// read data from database, calculate metrics, and write to db

// import { Postgres } from './postgres.js'
import { Db } from './db.js'
import * as lib from './lib.js'

console.log(`Ladder99 Meter`)
console.log(`---------------------------------------------------`)

const metricsFolder = './metrics'

async function start() {
  // get database connection
  // const postgres = new Postgres()
  // await postgres.start()
  const db = new Db()
  await db.start()

  // read client's setup.yaml
  const setup = lib.readSetup()

  // iterate over devices, check what metrics they want, if any,
  // load those metric plugins, start them up - let them poll db as needed etc.
  for (let device of setup.devices) {
    if (device.metrics) {
      const { metrics } = device
      for (let metric of metrics) {
        console.log(metric)
        const { name } = metric

        // import metric plugin
        const pathMetric = `${metricsFolder}/${name}.js` // eg './metrics/availability.js'
        console.log(`Meter - importing ${pathMetric}...`)
        const { Metric } = await import(pathMetric)
        const plugin = new Metric()

        // start it
        plugin.start({ db, device, metric })
      }
    }
  }
}

start()
