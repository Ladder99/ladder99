// ladder99 meter
// read data from database, calculate metrics, and write to db

import { Postgres } from './postgres.js'
import * as lib from './lib.js'

console.log(`Ladder99 Meter`)
console.log(`---------------------------------------------------`)

const metricsFolder = './metrics'

async function start() {
  // get database
  const postgres = new Postgres()
  await postgres.start()

  // read client's setup.yaml
  const setup = lib.readSetup()

  //. iterate over devices, check what metrics they want, if any,
  //  load those metric plugins, start them up - let them poll db as needed.
  for (let device of setup.devices) {
    if (device.metrics) {
      const { metrics } = device
      for (let metric of metrics) {
        console.log(metric)
        const { name } = metric

        // import metric plugin
        const pathMetric = `${metricsFolder}/${name}.js` // eg './metrics/availability.js'
        console.log(`Importing metric code: ${pathMetric}...`)
        const { Metric } = await import(pathMetric)
        const plugin = new Metric()

        // start it
        plugin.start({ metric, postgres })
      }
    }
  }
}

start()
