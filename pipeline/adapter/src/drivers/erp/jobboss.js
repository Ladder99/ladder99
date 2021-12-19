// jobboss driver

import mssql from 'mssql' // ms sql server driver
// import * as lib from '../../lib.js'

export class AdapterDriver {
  async init({ deviceId, protocol, cache, inputs, socket, connection }) {
    console.log(`JobBoss - initialize driver...`)

    setUnavailable()

    const config = {
      server: connection.server,
      database: connection.database,
      user: connection.user,
      password: connection.password,
    }

    console.log(`JobBoss - connecting to database...`, connection.server)

    mssql.connect(config, err => {
      console.log('JobBoss - connected')
      setAvailable()
      // poll for current job info
      setInterval(poll, 5000)
    })

    const sql = `select 42, 'hello'`
    //     const sql = `
    // select top 10 opt.*
    // from job_operation op
    // join job_operation_time opt on op.job_operation = opt.job_operation
    // where work_center = 'marumatsu'
    // and opt.work_date between '2021-11-18' and '2021-11-19'
    // `

    async function poll() {
      console.log(`JobBoss - polling for job info...`)
      const request = new mssql.Request()
      request.query(sql, (err, recordset) => {
        console.log(`JobBoss results`, recordset)
        cache.set(`${deviceId}-job`, '42')
      })
    }

    function setAvailable() {
      cache.set(`${deviceId}-availability`, 'AVAILABLE')
    }

    function setUnavailable() {
      cache.set(`${deviceId}-availability`, 'UNAVAILABLE')
      cache.set(`${deviceId}-job`, 'UNAVAILABLE')
    }
  }
}
