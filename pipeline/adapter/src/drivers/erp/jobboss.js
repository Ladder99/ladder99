// jobboss driver

import mssql from 'mssql' // ms sql server driver https://github.com/tediousjs/node-mssql
// import * as lib from '../../lib.js'

const pollInterval = 5000 // ms

export class AdapterDriver {
  async init({ deviceId, protocol, cache, inputs, socket, connection }) {
    console.log(`JobBoss - initialize driver...`)

    setUnavailable()

    const config = {
      server: connection.server,
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
