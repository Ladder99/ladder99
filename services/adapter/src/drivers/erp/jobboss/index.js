// jobboss driver

// reads data from jobboss mssql database.
// currently schedule and jobnum info per workcenter/device.
// writes to cache, which writes shdr to agent.

// for jobboss table structure see tables.jpg in this directory, or
// https://docs.google.com/spreadsheets/d/13RzXxUNby6-jIO4JUjKVCNG7ALc__HDkBhcnNfyK5-s/edit?usp=sharing

import mssql from 'mssql' // ms sql server driver https://github.com/tediousjs/node-mssql
import { Jobs } from './jobs.js'
import { Schedule } from './schedule.js'

const initialDelay = 6000 // ms
const waitForDb = 4000 // ms

export class AdapterDriver {
  // note - device here is the jobboss object from setup yaml -
  // this code will iterate over all devices in setup yaml to find ones with
  // jobbossId values and check their schedules and jobnums.
  async init({
    client,
    device,
    cache,
    connection, // { server, port, database, user, password } - set in setup.yaml
    devices, // from setup.yaml
  }) {
    console.log(`JobBoss - initialize driver...`)
    setUnavailable()

    // need to wait a bit to make sure the cutter cache items are setup before
    // writing to them. they're setup via the cutter/marumatsu module.
    //. better - check they are there in a loop with delay...
    //  ieg check cache.get('c-start') etc for existence?
    console.log(`JobBoss - waiting a bit...`)
    await new Promise(resolve => setTimeout(resolve, initialDelay))

    // mssql driver insists on a number for the port
    connection = { ...connection, port: Number(connection.port) }

    let pool
    while (!pool) {
      try {
        console.log(`JobBoss - connecting to database...`, connection.server)
        pool = await mssql.connect(connection)

        console.log(`JobBoss - connected`)
        setAvailable()

        // start the polls
        const jobs = new Jobs()
        const schedule = new Schedule()

        await jobs.start({ cache, pool, devices })
        await schedule.start({ cache, pool, devices, client })
        //
      } catch (error) {
        console.log(error)
        console.log(`JobBoss - no db - waiting a bit to try again...`)
        setUnavailable()
        await new Promise(resolve => setTimeout(resolve, waitForDb))
      }
    }

    //. method doesn't exist, but is in the readme
    // mssql.on('error', err => { })

    function setAvailable() {
      cache.set(`${device.id}-availability`, 'AVAILABLE')
    }

    function setUnavailable() {
      cache.set(`${device.id}-availability`, 'UNAVAILABLE')
    }
  }
}
