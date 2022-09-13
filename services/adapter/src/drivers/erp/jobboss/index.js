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
const waitForDb = 6000 // ms

const errorMessages = {
  ELOGIN: 'Login failed (locked out)',
  ETIMEOUT: 'Connection timeout',
  EALREADYCONNECTED: 'Database is already connected',
  EALREADYCONNECTING: 'Already connecting to database',
  EINSTLOOKUP: 'Instance lookup failed',
  ESOCKET: 'Socket error (could not connect to db url)',
}

export class AdapterDriver {
  //
  // note - device here is the jobboss object from setup yaml -
  // this code will iterate over all devices in setup yaml to find ones with
  // jobbossId values and check their schedules and jobnums.
  async init({
    client, // { name, timezone }
    device,
    cache,
    connection, // { server, port, database, user, password } - set in setup.yaml
    devices, // from setup.yaml
  }) {
    console.log(`JobBoss - initialize driver...`)
    setUnavailable()

    // need to wait a bit to make sure the cutter cache items are setup before
    // writing to them. they're setup via the cutter module.
    //. why? which items?
    //. better - check they are there in a loop with delay...
    //  ieg check cache.get('m1-start') etc for existence?
    console.log(`JobBoss - waiting a bit...`)
    await new Promise(resolve => setTimeout(resolve, initialDelay))

    connection = { ...connection, port: Number(connection.port) } // need number, not string

    // note: pool is the mssql global pool object - it's not gonna be destroyed if
    // there's an error, so no need to recreate it in error handlers.
    let pool
    while (!pool) {
      try {
        console.log(`JobBoss - connecting to database...`, connection.server)
        // connect will return the existing global pool or create a new one if it doesn't exist
        pool = await mssql.connect(connection)
      } catch (error) {
        await handleError(error) // print error and wait a bit
        // try again, in a loop
      }
    }

    // attach error handler
    // IMPORTANT: Always attach an error listener to created connection. Whenever
    // something goes wrong with the connection it will emit an error and if there is
    // no listener it will crash your application with an uncaught error.
    // pool.error(handleError)
    pool.on('error', handleError)

    console.log(`JobBoss - connected`)
    setAvailable()

    // start the polls
    const jobs = new Jobs() // fetch current jobnum
    const schedule = new Schedule() // fetch current schedule hours

    await jobs.start({ cache, pool, devices })
    await schedule.start({ cache, pool, devices, client })

    // only close a pool when you know it will never be needed by the application again.
    // Typically this will only be when your application is shutting down.
    //. ie add interrupt handlers
    // pool.close()

    // helper fns

    function setAvailable() {
      cache.set(`${device.id}-availability`, 'AVAILABLE')
    }

    function setUnavailable() {
      cache.set(`${device.id}-availability`, 'UNAVAILABLE')
    }

    async function handleError(error) {
      const msg = errorMessages[error.code] || error.code
      console.log('JobBoss error: ', msg)
      console.log('JobBoss - waiting a bit to try again...')
      setUnavailable()
      await new Promise(resolve => setTimeout(resolve, waitForDb))
    }
  }
}
