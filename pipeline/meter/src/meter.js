// ladder99 meter
// read data from database, calculate metrics, and write to db

import { Postgres } from './postgres.js'
import * as lib from './lib.js'

console.log(`Ladder99 Meter`)
console.log(`---------------------------------------------------`)

async function start() {
  // get database
  const postgres = new Postgres()
  await postgres.start()

  // read client's setup.yaml
  const setup = lib.readSetup()

  //. iterate over devices, check what metrics they want,
  //  load those metric plugins, start them up
}

start()
