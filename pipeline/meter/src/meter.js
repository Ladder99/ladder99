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
        if (metric.name === 'availability') {
          //. poll db for active and available times
        }
      }
    }
  }
}

start()
