// jobboss driver

// for jobboss table structure see jobboss.jpg in this directory, or
// https://docs.google.com/spreadsheets/d/13RzXxUNby6-jIO4JUjKVCNG7ALc__HDkBhcnNfyK5-s/edit?usp=sharing

import mssql from 'mssql' // ms sql server driver https://github.com/tediousjs/node-mssql
import * as lib from '../../lib.js'

const initialDelay = 6000 // ms
const jobPollInterval = 5000 // ms
const schedulePollInterval = 1 * 60 * 1000 // ms

export class AdapterDriver {
  constructor() {
    this.pool = null
    this.devices = null
    this.cache = null
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
    this.cache = cache

    // need to wait a bit to make sure the cutter cache items are setup before
    // writing to them. they're setup via the cutter/marumatsu module.
    //. better - check they are there in a loop with delay...
    //  ieg check cache.get('c-start') etc for existence?
    console.log(`JobBoss - waiting a bit...`)
    await lib.sleep(initialDelay)

    while (!this.pool) {
      try {
        console.log(`JobBoss - connecting to database...`, connection.server)
        // this.pool = await mssql.connect(connection)
        this.pool = await mssql.connect({
          ...connection,
          port: Number(connection.port), // mssql driver insists on a number here
        })
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

  // poll the jobboss schedule information for current day,
  // and write to the cache
  async pollSchedule() {
    const datetime = new Date() // now
    for (let device of this.devices) {
      if (device.jobbossId) {
        const schedule = await this.getSchedule(device, datetime) // get { start, stop }
        console.log(schedule)
        // write start/stop times to cache for this device
        this.cache.set(`${device.id}-start`, schedule.start)
        this.cache.set(`${device.id}-complete`, schedule.stop)
      }
    }
  }

  // get workcenter schedule for given device and datetime.
  // returns as { start, stop } times, both strings like '05:00:00', or nulls.
  async getSchedule(device, datetime) {
    console.log(`JobBoss - getSchedule for`, device.name, datetime)

    const workcenter = device.jobbossId // eg '8EE4B90E-7224-4A71-BE5E-C6A713AECF59' for Marumatsu
    const sequence = datetime.getDay() // day of week with 0=sunday, 1=monday. this works even if Z time is next day.
    const date = getDateFromDateTime(datetime) // eg '2022-01-18' - works even if Z time is next day.

    // lookup workcenter and date in wc shift override table
    const result1 = await this.pool.query`
    select Shift_ID, Is_Work_Day 
    from WCShift_Override
    where WorkCenter_OID=${workcenter} and cast(Date as date)=${date}
    `
    console.log(result1)

    let start = null
    let stop = null

    if (result1.recordset.length === 0) {
      console.log(`JobBoss - no override record, so get standard schedule...`)
      // if no record then lookup workcenter in WCShift_Standard
      //   get shift_id, look that up with sequencenum in shift_day table for start/end
      // (or do a join query)
      const result2 = await this.pool.query`
      select cast(Start_Time as time) start, cast(End_Time as time) stop
      from WCShift_Standard wss
        join Shift_Day sd on wss.Shift_ID=sd.Shift
      where WorkCenter_OID=${workcenter} and Sequence=${sequence}
      `
      console.log(result2)
      if (result2.recordset.length > 0) {
        start = result2.recordset[0].start // eg 1970-01-01T05:00:00Z - note the Z
        stop = result2.recordset[0].stop // eg 1970-01-01T13:30:00Z
      }
    } else if (result1.recordset[0].Is_Work_Day === 1) {
      console.log(`JobBoss - work day override - get schedule...`)
      // if isworkday=1 then lookup hours in shift_day table -
      //   get shift_id, lookup in shift_day table with dayofweek for sequencenum
      //   get start/end times from record
      const result3 = await this.pool.query`
      select cast(Start_Time as time) start, cast(End_Time as time) stop
      from WCShift_Override wso
        join Shift_Day sd on wso.Shift_ID = sd.Shift
      where WorkCenter_OID=${workcenter} and Date=${date} and Sequence=${sequence}
      `
      console.log(result3)
      if (result3.recordset.length > 0) {
        start = result3.recordset[0].start
        stop = result3.recordset[0].stop
      }
    } else {
      // if isworkday=0 then not a workday - might have 2 records, one for each shift
      //   for now just say the whole day is a holiday - no start/end times
      //. does that mean don't write anything? or unavail? or holiday?
      console.log(`JobBoss - day is holiday (isworkday=0)...`)
      start = 'HOLIDAY'
      stop = 'HOLIDAY'
    }

    // these all use local time, not Z time
    if (start) {
      start.setFullYear(datetime.getFullYear())
      start.setMonth(datetime.getMonth())
      start.setDate(datetime.getDate())
      start = start.toISOString()
    }
    if (stop) {
      stop.setFullYear(datetime.getFullYear())
      stop.setMonth(datetime.getMonth())
      stop.setDate(datetime.getDate())
      stop = stop.toISOString()
    }
    return { start, stop }
  }

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

  // for (let device of this.devices) {
  //   if (device.jobbossId) {

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

// get a date string from a datetime value,
// eg 2022-01-18T14:24:00 -> '2022-01-18'
// accounts for timezone offset
function getDateFromDateTime(dt = new Date()) {
  const date = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000)
    .toISOString()
    .split('T')[0]
  return date
}
