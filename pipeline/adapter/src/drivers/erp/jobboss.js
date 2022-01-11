// jobboss driver

import mssql from 'mssql' // ms sql server driver https://github.com/tediousjs/node-mssql
import * as lib from '../../lib.js'

const pollInterval = 5000 // ms

export class AdapterDriver {
  async init({
    deviceId,
    protocol,
    cache,
    inputs,
    socket,
    connection,
    devices, // from setup.yaml
  }) {
    console.log(`JobBoss - initialize driver...`)

    setUnavailable()

    // need to wait a bit to make sure the cutter cache items are setup before
    // writing to them. they're setup via the cutter/marumatsu module.
    console.log(`JobBoss - waiting a while...`)
    await lib.sleep(6000)

    //.. will need to know all the relevant devices to lookup and set times for
    // eg c1, c2, c3...
    //. cache doesn't allow using arbitrary device ids here?
    // ie these got called but didn't send shdr
    // these will use the deviceId prefix assoc with this driver, ie 'j-'
    //. so need to be able to pass that as an optional param here?
    //. so will loop over the devices from setup.yaml,
    // look up times in db, and set their value here.
    cache.set(`c-start`, '2022-01-11 03:00:00')
    cache.set(`c-complete`, '2022-01-11 15:30:00')

    const config = {
      server: connection.server,
      port: connection.port,
      database: connection.database,
      user: connection.user,
      password: connection.password,
      options: {
        encrypt: false,
      },
    }

    const sql = `select 42, 'hello'`
    // const sql = `
    // select top 10 opt.*
    // from job_operation op
    // join job_operation_time opt on op.job_operation = opt.job_operation
    // where work_center = 'marumatsu'
    // and opt.work_date between '2021-11-18' and '2021-11-19'
    // `

    console.log(`JobBoss - connecting to database...`, connection.server)
    let pool
    try {
      pool = await mssql.connect(config) //. error - login fail why - wrong pw?
      console.log(`JobBoss - connected`)
      setAvailable()
      await poll() // do initial poll immediately
      setInterval(poll, pollInterval) // poll every n seconds
    } catch (error) {
      console.log(error)
    }

    async function poll() {
      console.log(`JobBoss - polling for job info...`)
      try {
        const result = await pool
          .request()
          // .input('input_parameter', mssql.Int, 33)
          // .query('select * from mytable where id = @input_parameter')
          .query(sql)
        console.log(`JobBoss result -`)
        console.dir(result)
        cache.set(`${deviceId}-job`, '42')
      } catch (error) {
        console.log(error)
      }
    }

    //. method doesn't exist, but is in the readme
    // mssql.on('error', err => {
    //   // ... error handler
    // })

    function setAvailable() {
      cache.set(`${deviceId}-availability`, 'AVAILABLE')
    }

    function setUnavailable() {
      cache.set(`${deviceId}-availability`, 'UNAVAILABLE')
      cache.set(`${deviceId}-job`, 'UNAVAILABLE')
    }
  }
}
