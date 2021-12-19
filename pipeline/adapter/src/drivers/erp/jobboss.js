// jobboss driver

// import tedious from 'tedious' // mssql driver https://github.com/tediousjs/tedious
import mssql from 'mssql'
// import * as lib from '../../lib.js'

export class AdapterDriver {
  async init({ deviceId, protocol, cache, inputs, socket, connection }) {
    console.log(`JobBoss - initialize driver...`)

    setUnavailable()

    // const config = {
    //   server: connection.server,
    //   authentication: {
    //     type: 'default',
    //     options: {
    //       userName: connection.username,
    //       password: connection.password,
    //     },
    //   },
    //   options: {
    //     encrypt: false,
    //     database: connection.database,
    //     // cryptoCredentialsDetails: {
    //     //   minVersion: 'TLSv1',
    //     // },
    //   },
    // }

    const config = {
      server: connection.server,
      user: connection.username,
      password: connection.password,
      database: connection.database,
      // options: {
      //   encrypt: false,
      //   database: connection.database,
      // },
    }

    // const Connection = tedious.Connection
    console.log(`JobBoss - connecting to database...`, connection.server)
    // const db = new Connection(config)
    // db.on('connect', error => {
    //   console.log('JobBoss - connected')
    //   setAvailable()
    //   //. poll for current job info
    //   setInterval(poll, 5000)
    // })
    // db.on('error', error => {
    //   console.log(error)
    //   setUnavailable()
    // })
    // db.on('end', () => {
    //   console.log(`JobBoss - disconnected from database`)
    //   setUnavailable()
    // })
    // db.connect()

    mssql.connect(config, err => {
      console.log('JobBoss - connected')
      setAvailable()
      // poll for current job info
      setInterval(poll, 5000)
    })

    // const sql = `select 42, 'hello world'`
    const sql = `
select top 10 opt.*
from job_operation op
join job_operation_time opt on op.job_operation = opt.job_operation
where work_center = 'marumatsu'
and opt.work_date between '2021-11-18' and '2021-11-19'
`

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
