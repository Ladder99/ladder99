// jobboss driver

// there's only one jobboss driver - it iterates over all devices and checks for jobbossId,
// then queries the jobboss mssql db for the most recent job for that workcenter,
// and the schedule start and stop times.
// writes values to cache, which writes shdr to agent.

// each device/workcenter that you want to query should have a custom
// section in the setup.yaml with the jobbossId, which is the ObjectId from
// the Work_Center table - eg
//   `select ObjectId from Work_Center where Work_Center='BAHMULLER'` gives
// custom:
//   jobbossId: 8CE0EEA3-E5FE-4475-9D9E-078EEB56E758

// for jobboss table structure see tables.jpg in this directory, or
// https://docs.google.com/spreadsheets/d/13RzXxUNby6-jIO4JUjKVCNG7ALc__HDkBhcnNfyK5-s/edit?usp=sharing

import mssql from 'mssql' // ms sql server driver https://github.com/tediousjs/node-mssql
import { Jobs } from './jobs.js'
import { Schedule } from './schedule.js'

//. make params object
const initialDelay = 5000 // ms
const waitForDb = 15000 // ms - because db timeout is 15secs

export class AdapterDriver {
  //
  async start({
    client, // { name, timezone } // top-level client info from setup.yaml
    device, // { id, ... } // jobboss driver config from setup.yaml
    source, // { module, driver, connection, ... } // jobboss db info
    devices, // [{ id, name, custom: { jobbossId, ... }, ...}, ...] // all devices in setup.yaml
    cache, // shared cache
  }) {
    console.log(`JobBoss - start driver...`)
    setUnavailable()

    if (source.simulate) {
      console.log(`JobBoss - start simulator...`)
      simulate()
      return
    }

    if (!source.connection?.server || !source.connection?.port) {
      console.log(`JobBoss error no connection info. check setup.yaml, envars.`)
      return
    }

    // wait to make sure all cutter cache items are setup before
    // writing to them. they're setup via the cutter module.
    await waitForCacheItems()

    // make connection object, { server, port, database, user, password }
    const port = Number(source.connection.port) // mssql needs number, not string
    const connection = { ...source.connection, port }

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

    // set jobboss driver availability
    function setAvailable() {
      cache.set(`${device.id}-availability`, 'AVAILABLE')
    }
    function setUnavailable() {
      cache.set(`${device.id}-availability`, 'UNAVAILABLE')
    }

    async function handleError(error) {
      console.log('JobBoss error', error.message)
      console.log('JobBoss waiting a bit to try again...')
      setUnavailable()
      await new Promise(resolve => setTimeout(resolve, waitForDb))
    }

    async function waitForCacheItems() {
      console.log(`JobBoss waiting until cache dataitems populated...`)
      for (let device of devices) {
        if (device.custom?.jobbossId) {
          const key = `${device.id}-start`
          while (!cache.hasOutput(key)) {
            console.log(`JobBoss - waiting on ${key}...`)
            await new Promise(resolve => setTimeout(resolve, initialDelay))
          }
        }
      }
      console.log(`JobBoss all cache dataitems populated.`)
    }

    // simulate a jobboss connection
    async function simulate() {
      setAvailable()
      await waitForCacheItems()
      for (let job = 1000; true; job++) {
        cache.set(`m1-job`, job)
        await new Promise(resolve => setTimeout(resolve, 10000)) // pause
      }
    }
  }
}
