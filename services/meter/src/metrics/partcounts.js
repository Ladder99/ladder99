// read/write values for partcounts

const minutes = 60 * 1000 // 60 ms
const hours = 60 * minutes
const days = 24 * hours

const backfillDefaultStart = 60 * days // ie look this far back for first backfill date, by default
const metricIntervalDefault = 60 // seconds
const resolutions = 'minute,hour,day,week,month,year'.split(',') //. 5min? 15min?

export class Metric {
  constructor() {
    this.device = null
    this.metric = null
    this.db = null
    this.interval = null
    this.timer = null
  }

  async start({ client, db, device, metric }) {
    console.log(`Meter - initialize partcounts metric...`)
    this.client = client
    this.db = db
    this.device = device
    this.metric = metric

    this.timezoneOffset = client.timezoneOffsetHrs * hours // ms

    console.log(`Meter - get device node_id...`)
    this.device.node_id = await this.db.getDeviceId(device.name) // repeats until device is there
    console.log(this.device)

    this.lifetimeId = await this.db.getDataItemId(metric.lifetimePath) // repeat until dataitem there
    console.log(this.lifetimeId)

    // get polling interval - either from metric in setup yaml or default value
    this.interval = (metric.interval || metricIntervalDefault) * 1000 // ms

    //...
    // await this.backfill() // backfill missing values
    await this.poll() // do first poll
    // this.timer = setInterval(this.poll.bind(this), this.interval) // poll db
  }

  // async backfill() {
  //   console.log(`Meter - backfilling any missed dates...`)

  //   const now = new Date()
  //   const defaultStart = new Date(now.getTime() - backfillDefaultStart) // eg 60d ago

  //   // get starting point by finding most recent record in bins
  //   const sql = `
  //     select time
  //     from bins
  //     where device_id=${this.device.node_id}
  //     order by time desc
  //     limit 1;
  //   `
  //   const result = await this.db.query(sql)
  //   const lastRead = result.rows.length > 0 && result.rows[0].time
  //   console.log(`lastRead`, lastRead)
  //   const startBackfill = lastRead ? new Date(lastRead) : defaultStart
  //   console.log(`startBackfill`, startBackfill)

  //   // get list of start/stop times since then, in order
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

  //   // loop from startstart to now, interval 1 min
  //   // check for active and available
  //   // write to bins table those values
  //   const startMinute = Math.floor(startBackfill.getTime() / minutes)
  //   const nowMinute = Math.floor(now.getTime() / minutes)
  //   console.log(`start, now`, startMinute, nowMinute)
  //   let state = null
  //   for (let minute = startMinute; minute < nowMinute; minute++) {
  //     const path = startStopTimes[minute]
  //     if (path === this.metric.startPath) {
  //       state = 1
  //     } else if (path === this.metric.stopPath) {
  //       state = 0
  //     }
  //     if (state) {
  //       const time = new Date(minute * minutes)
  //       await this.updateBins(time, this.interval)
  //     }
  //   }
  //   console.log(`Backfill done`)
  // }

  // poll db and update bins - called by timer
  async poll() {
    console.log('Meter Partcounts - poll db and update ')
    // const now = new Date()

    // check if we're within scheduled time
    // console.log(`Meter - in scheduled time window - updatebins...`)
    // await this.updateBins(now, this.interval)
  }
}
