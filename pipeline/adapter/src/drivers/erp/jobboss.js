// jobboss driver

import mssql from 'mssql' // ms sql server driver https://github.com/tediousjs/node-mssql
import * as lib from '../../lib.js'

const initialDelay = 6000 // ms
const jobPollInterval = 5000 // ms
const schedulePollInterval = 1 * 60 * 1000 // ms

// //. hardcoded schedule for now
// const schedule = {
//   workdays: [
//     { day: 1, start: '5:00', stop: '15:30' }, // mon
//     { day: 2, start: '5:00', stop: '15:30' }, // tue
//     { day: 3, start: '5:00', stop: '15:30' }, // wed
//     { day: 4, start: '5:00', stop: '15:30' }, // thu
//     { day: 5, start: '5:00', stop: '13:30' }, // fri
//     { day: 6, start: '5:00', stop: '13:00' }, // sat
//   ],
//   holidays: ['2021-12-25', '2021-12-31', '2021-01-01', '2021-01-03'],
// }

export class AdapterDriver {
  constructor() {
    this.pool = null
  }

  // note - device here is the jobboss object from setup yaml -
  // this code will iterate over all devices in setup yaml to find ones with
  // jobbossId values and check their schedules and jobnums.
  async init({
    deviceId,
    device,
    protocol,
    cache,
    inputs,
    socket,
    connection, // { server, port, database, user, password } - set in setup.yaml
    devices, // from setup.yaml
  }) {
    console.log(`JobBoss - initialize driver...`)

    this.devices = devices

    // need to wait a bit to make sure the cutter cache items are setup before
    // writing to them. they're setup via the cutter/marumatsu module.
    //. better - check they are there in a loop with delay...
    //  ieg check cache.get('c-start') etc for existence?
    console.log(`JobBoss - waiting a bit...`)
    await lib.sleep(initialDelay)

    while (!this.pool) {
      try {
        console.log(`JobBoss - connecting to database...`, connection.server)
        this.pool = await mssql.connect(connection)
        console.log(`JobBoss - connected`)
        // this.setAvailable()

        // get schedule info
        // will check jobboss schedule info for each device in devices
        // await this.backfillSchedule()
        await this.pollSchedule() // do initial poll
        setInterval(this.pollSchedule.bind(this), schedulePollInterval) // start poll timer

        // // get job info
        // // will check jobnum for each device in devices
        // // await this.backfillJob()
        // await this.pollJob() // do initial poll
        // setInterval(this.pollJob.bind(this), jobPollInterval) // start poll timer
      } catch (error) {
        console.log(error)
        console.log(`JobBoss - no db - waiting a bit to try again...`)
        await new Promise(resolve => setTimeout(resolve, 4000))
      }
    }
  }

  async pollSchedule() {
    const schedule = await this.getSchedule()
  }

  // get workcenter schedule for given day and shift.
  // lookup workcenter and date in wc shift override table
  // if isworkday=1 then lookup hours in shift_day table -
  //   get shift_id, lookup in shift_day table with dayofweek for sequencenum
  //   get start/end times from record
  // if isworkday=0 then not a workday - might have 2 records, one for each shift
  //   for now just say it's a holiday - no start/end times
  // if no record then lookup workcenter in WCShift_Standard
  //   get shift_id, look that up with sequencenum in shift_day table for start/end
  async getSchedule(date, shift = 'FIRST') {
    const sql = `
    `
    // const result = await this.pool.query`select * from mytable where id = ${value}`
    // console.dir(result)
    const start = 0
    const stop = 0
    return { start, stop }
  }

  // // get start/stop times for given device and day
  // //. default day to today
  // async getTimes(device, day) {
  //   const start = 0
  //   const stop = 0
  //   const times = { start, stop }
  //   return times
  // }

  // getToday() {
  //   const now = new Date()
  //   const today = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
  //   return today
  // }

  // getDay(datetime = new Date()) {
  //   const day = new Date(
  //     datetime.getTime() - datetime.getTimezoneOffset() * 60000
  //   )
  //     .toISOString()
  //     .split('T')[0]
  //   return day
  // }

  // //. uhhh not good - still says time is Z
  // getToday() {
  //   const now = new Date()
  //   const day = Math.floor(
  //     (now.getTime() - now.getTimezoneOffset() * 60000) / 8.64e7
  //   )
  //   return day
  // }

  // async backfillSchedule() {
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

  // //. get last day written to our pg db
  // // how do we get that?
  // async getLastDay(device) {
  //   // return new Date()
  // }

  // async pollJob() {
  //   console.log(`JobBoss - polling for job info...`)
  //   // cache.set(`${deviceId}-job`, Math.floor(Math.random() * 1000))

  //   // const sql = `select 42, 'hello'`
  //   const sql = `
  //   select top 1
  //     job
  //   from
  //     job_operation
  //   where
  //     -- work_center = 'MARUMATSU'
  //     -- workcenter_oid = '8EE4B90E-7224-4A71-BE5E-C6A713AECF59'
  //     workcenter_oid = '${device.jobbossId}'
  //   order by
  //     actual_start desc
  //   `
  //   try {
  //     const result = await pool.request().query(sql)
  //     //. use this form --
  //     // const result = await pool.request()
  //     //   .input('input_parameter', mssql.Int, 33)
  //     //   .query('select * from mytable where id = @input_parameter')
  //     console.log(`JobBoss result`, result)
  //     //. parse result object
  //     // cache.set(`${deviceId}-job`, '42')
  //   } catch (error) {
  //     console.log(error)
  //   }
  // }

  //. method doesn't exist, but is in the readme
  // mssql.on('error', err => {
  //   // ... error handler
  // })

  //  setAvailable() {
  //   cache.set(`${deviceId}-availability`, 'AVAILABLE')
  // }

  //  setUnavailable() {
  //   cache.set(`${deviceId}-availability`, 'UNAVAILABLE')
  //   cache.set(`${deviceId}-job`, 'UNAVAILABLE')
  // }
}
