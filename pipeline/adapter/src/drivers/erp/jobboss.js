// jobboss driver

import mssql from 'mssql' // ms sql server driver https://github.com/tediousjs/node-mssql
import * as lib from '../../lib.js'

const initialDelay = 6000 // ms
const jobPollInterval = 5000 // ms
const schedulePollInterval = 1 * 60 * 1000 // 1 mins in ms

//. hardcoded schedule for now
const schedule = {
  workdays: [
    { day: 1, start: '5:00', stop: '15:30' }, // mon
    { day: 2, start: '5:00', stop: '15:30' }, // tue
    { day: 3, start: '5:00', stop: '15:30' }, // wed
    { day: 4, start: '5:00', stop: '15:30' }, // thu
    { day: 5, start: '5:00', stop: '13:30' }, // fri
    { day: 6, start: '5:00', stop: '13:00' }, // sat
  ],
  holidays: ['2021-12-25', '2021-12-31', '2021-01-01', '2021-01-03'],
}

export class AdapterDriver {
  async init({
    deviceId,
    protocol,
    cache,
    inputs,
    socket,
    connection, // { server, port, database, user, password } - set in setup.yaml
    devices, // from setup.yaml
  }) {
    console.log(`JobBoss - initialize driver...`)

    // need to wait a bit to make sure the cutter cache items are setup before
    // writing to them. they're setup via the cutter/marumatsu module.
    //. better - check they are there in a loop with delay...
    console.log(`JobBoss - waiting a bit...`)
    await lib.sleep(initialDelay)

    console.log(`JobBoss - connecting to database...`, connection.server)
    let pool
    try {
      pool = await mssql.connect(connection)
      console.log(`JobBoss - connected`)
      setAvailable()
      // await backfillSchedule()
      // await pollJob() // do initial job poll
      // setInterval(pollJob, jobPollInterval) // start job poll
      // setInterval(pollSchedule, schedulePollInterval) // start schedule poll
    } catch (error) {
      console.log(error)
    }

    //. turn this off after get db working
    await pollJob() // do initial job poll
    setInterval(pollJob, jobPollInterval) // start job poll

    // function getToday() {
    //   const now = new Date()
    //   const today = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    //   return today
    // }

    // function getDay(datetime = new Date()) {
    //   const day = new Date(
    //     datetime.getTime() - datetime.getTimezoneOffset() * 60000
    //   )
    //     .toISOString()
    //     .split('T')[0]
    //   return day
    // }

    // //. uhhh not good - still says time is Z
    // function getToday() {
    //   const now = new Date()
    //   const day = Math.floor(
    //     (now.getTime() - now.getTimezoneOffset() * 60000) / 8.64e7
    //   )
    //   return day
    // }

    // async function backfillSchedule() {
    //   console.log(`JobBoss backfilling any missed dates...`)
    //   const today = getToday()
    //   console.log(today)
    //   // loop over devices from setup.yaml
    //   for (let device of devices) {
    //     // just want those with a jobboss id (workcenter uuid)
    //     if (device.jobbossId) {
    //       // get last day scheduled for this device
    //       const lastDay = await getLastDay(device)
    //       // lookup missing days and set values
    //       for (let day = lastDay; day < today; day++) {
    //         const times = await getTimes(device, day) // { start, stop }
    //         // cache.set(`${device.id}-start`, '2022-01-11 03:00:00')
    //         // cache.set(`${device.id}-complete`, '2022-01-11 15:30:00')
    //         cache.set(`${device.id}-start`, '2022-01-11 03:00:00')
    //         cache.set(`${device.id}-complete`, '2022-01-11 15:30:00')
    //       }
    //     }
    //   }
    // }

    // async function pollSchedule() {
    // // const sql = `
    // // select top 1
    // //   opt.*
    // // from
    // //   job_operation op
    // //   join job_operation_time opt on op.job_operation = opt.job_operation
    // // where
    // //   work_center = 'marumatsu'
    // //   and opt.work_date between '2021-11-18' and '2021-11-19'
    // // `
    // }

    // // get start/stop times for given device and day
    // //. default day to today
    // async function getTimes(device, day) {
    //   const start = 0
    //   const stop = 0
    //   const times = { start, stop }
    //   return times
    // }

    // //. get last day written to our pg db
    // // how do we get that?
    // async function getLastDay(device) {
    //   // return new Date()
    // }

    async function pollJob() {
      console.log(`JobBoss - polling for job info...`)
      cache.set(`${deviceId}-job`, Math.floor(Math.random() * 1000))

      // const sql = `select 42, 'hello'`
      // try {
      //   const result = await pool
      //     .request()
      //     // .input('input_parameter', mssql.Int, 33)
      //     // .query('select * from mytable where id = @input_parameter')
      //     .query(sql)
      //   console.log(`JobBoss result`, result)
      //   cache.set(`${deviceId}-job`, '42')
      // } catch (error) {
      //   console.log(error)
      // }
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
