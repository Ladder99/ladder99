// read/write values for partcounts

const minutes = 60 * 1000 // 60 ms
const hours = 60 * minutes
const days = 24 * hours

const metricIntervalDefault = 5 // seconds
// const backfillDefaultStart = 60 * days // ie look this far back for first backfill date, by default
// const resolutions = 'minute,hour,day,week,month,year'.split(',') //. 5min? 15min?

export class Metric {
  constructor() {
    this.device = null
    this.metric = null
    this.db = null
    this.interval = null
    this.timer = null
    this.device_id = null
    this.lifetime_id = null
  }

  async start({ client, db, device, metric }) {
    console.log(`Meter Partcounts - initialize partcounts metric...`)
    this.client = client
    this.db = db
    this.device = device
    this.metric = metric

    this.timezoneOffset = client.timezoneOffsetHrs * hours // ms

    console.log(`Meter Partcounts - get device node_id...`)
    this.device_id = await this.db.getDeviceId(device.name) // repeats until device is there
    console.log(this.device)

    // need this dataitemId as we'll be writing directly to the history table
    this.lifetime_id = await this.db.getDataItemId(metric.lifetimePath) // repeat until dataitem there
    console.log(this.lifetime_id)

    // get polling interval - either from metric in setup yaml or default value
    this.interval = (metric.interval || metricIntervalDefault) * 1000 // ms

    // await this.backfill() // backfill missing values
    await this.poll() // do first poll
    this.timer = setInterval(this.poll.bind(this), this.interval) // poll db
  }

  // poll db and update lifetime count - called by timer
  async poll() {
    console.log('Meter Partcounts - poll db and write lifetime counts ')

    const now = new Date()
    const start = new Date(now.getTime() - this.interval)
    const stop = now

    // get last lifetime value, before start time
    let lifetime = await this.getLastValue(
      this.device.name,
      this.metric.lifetimePath,
      start
    )

    const rows = await this.getPartCounts(start, stop)
    // rows will be like (for start=10:00:00am, stop=10:00:05am)
    // time, value
    // 9:59:59am, 99
    // 10:00:00am, 100
    // 10:00:01am, 101
    // 10:00:02am, 102
    // 10:00:03am, "0"
    // 10:00:04am, 1
    // 10:00:05am, 2
    if (rows && rows.length > 1) {
      let previous = rows[0] // { time, value }
      for (let row of rows.slice(1)) {
        // get delta from previous value
        const delta = row.value - previous.value
        if (delta > 0) {
          //. write time, lifetime+delta
          lifetime += delta
          // write time, lifetime
          await this.writeLifetimeCount(
            this.device_id,
            this.lifetime_id,
            lifetime
          )
        }
        previous = row
      }
    }
  }

  async writeLifetimeCount(device_id, lifetime_id, time, lifetime) {
    const sql = `
      insert into history (node_id, dataitem_id, time, value)
      values (${device_id}, ${lifetime_id}, '${time}', ${lifetime});
    `
    const result = await this.db.query(sql)
    return result.rows
  }

  async getPartCounts(start, stop) {
    const sql = `
      select 
        time, value
      from 
        history_float
      where
        device = '${this.device.name}'
        and path = '${this.metric.deltaPath}'
        and time between '${start.toISOString()}' and '${stop.toISOString()}'
      union (
        select 
          time, value
        from 
          history_float
        where
          device = '${this.device.name}'
          and path = '${this.metric.deltaPath}'
          and time < '${start.toISOString()}'
        order by 
          time desc
        limit 1
      )
      order by 
        time asc;
    `
    const result = await this.db.query(sql)
    return result.rows
  }

  async getLastValue(device, path, start) {
    const sql = `
      select 
        time, value
      from 
        history_float
      where
        device = '${device.name}' 
        and path = '${path}'
        and time < '${start}'
      order by 
        time desc
      limit 1;
    `
    const result = await this.db.query(sql)
    const recent = result.rows.length > 0 && result.rows[0] // null or { time, value }
    return recent
  }

  // async backfill() {
  //   console.log(`Meter Partcounts - backfill any missed partcounts...`)

  //   //. get most recent delta and lifetime values
  //   const recentDelta = await this.getRecent(this.device, this.metric.deltaPath)
  //   const recentLifetime = await this.getRecent(
  //     this.device,
  //     this.metric.lifetimePath
  //   )
  //   // const startBackfill = lastRead && new Date(lastRead)

  //   const sql2 = `
  //     select time, path, value
  //     from history_all
  //     where
  //       device = '${this.device.name}'
  //       and path in ('${this.metric.startPath}', '${this.metric.stopPath}')
  //       and time >= '${startBackfill.toISOString()}'
  //     order by time asc;
  //   `
  //   const result2 = await this.db.query(sql2)

  //   // loop over start/stop times, add to a dict
  //   // row.value is sthing like '2022-01-27T05:00:00' with NO Z -
  //   // ie it's 'local' time, which can only be interpreted correctly by
  //   // knowing the client's timezone. so need to subtract that offset
  //   const startStopTimes = {}
  //   for (let row of result2.rows) {
  //     const localTime = row.value
  //     const time = new Date(localTime).getTime() - this.timezoneOffset
  //     if (!isNaN(time)) {
  //       const minute = Math.floor(time / minutes)
  //       startStopTimes[minute] = row.path
  //     }
  //   }
  //   console.log('dict', startStopTimes)

  //   // // loop from startstart to now, interval 1 min
  //   // // check for active and available
  //   // // write to bins table those values
  //   // const startMinute = Math.floor(startBackfill.getTime() / minutes)
  //   // const nowMinute = Math.floor(now.getTime() / minutes)
  //   // console.log(`start, now`, startMinute, nowMinute)
  //   // let state = null
  //   // for (let minute = startMinute; minute < nowMinute; minute++) {
  //   //   const path = startStopTimes[minute]
  //   //   if (path === this.metric.startPath) {
  //   //     state = 1
  //   //   } else if (path === this.metric.stopPath) {
  //   //     state = 0
  //   //   }
  //   //   if (state) {
  //   //     const time = new Date(minute * minutes)
  //   //     await this.updateBins(time, this.interval)
  //   //   }
  //   // }
  //   // console.log(`Backfill done`)
  // }
}
