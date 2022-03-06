// read values and write the rate of change between them

// can use to get the production rate from a counter

const metricIntervalDefault = 5 // seconds

export class Metric {
  //
  async start({ client, db, device, metric }) {
    console.log(`Rate - initialize rate metric...`)
    this.client = client
    this.db = db
    this.device = device
    this.metric = metric

    console.log(`Rate - get device node_id...`)
    this.device_id = await this.db.getDeviceId(device.name) // repeats until device is there

    // need this dataitemId as we'll be writing directly to the history table
    this.rate_id = await this.db.getDataItemId(metric.ratePath) // repeat until dataitem there
    console.log('Rate - rate_id', this.rate_id)

    // get polling interval - either from metric in setup yaml or default value
    this.interval = (metric.interval || metricIntervalDefault) * 1000 // ms

    await this.backfill() // backfill any missing values
    await this.poll() // do first poll
    this.timer = setInterval(this.poll.bind(this), this.interval) // poll db
  }

  // poll db and update rate - called by timer
  async poll() {
    console.log('Rate - poll db and write rate')

    const now = new Date()

    const start = new Date(now.getTime() - this.interval).toISOString()
    const stop = now.toISOString()

    const device = this.device.name
    const path = this.metric.valuePath

    // get last value, before start time
    let value = 0
    // const record = await this.getLastRecord(
    //   this.device.name,
    //   this.metric.valuePath,
    //   start
    // )
    const record = await this.getLastRecord(device, path, start)
    if (record) {
      value = record.value
    }
    console.log('Rate - value', value)

    // const rows = await this.getCounts(start, stop)
    const rows = await this.db.getCounts(device, path, start, stop)
    console.log('Rate - rows', rows)
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
          //. write time, value+delta
          value += delta
          // write time, value
          await this.db.writeHistory(
            this.device_id,
            this.rate_id,
            row.time.toISOString(),
            value
          )
        }
        previous = row
      }
    }
  }

  // get last value of a path from history_float view, before a given time.
  // start should be an ISO datetimestring
  // returns null or { time, value }
  //. move to db as is
  async getLastRecord(device, path, start) {
    const sql = `
      select 
        time, value
      from 
        history_float
      where
        device = '${device}' 
        and path = '${path}'
        and time < '${start}'
      order by 
        time desc
      limit 1;
    `
    const result = await this.db.query(sql)
    const record = result.rows.length > 0 && result.rows[0]
    return record // null or { time, value }
  }

  // get first value of a path from history_float view.
  //. move to db as is
  async getFirstRecord(device, path) {
    const sql = `
      select 
        time, value
      from 
        history_float
      where
        device = '${device}' 
        and path = '${path}'
      order by 
        time asc
      limit 1;
    `
    const result = await this.db.query(sql)
    const record = result.rows.length > 0 && result.rows[0]
    return record // null or { time, value }
  }

  // backfill any missing rate records
  async backfill() {
    console.log(`Rate - backfill any missing rate records...`)

    const now = new Date()

    const device = this.device.name
    const path = this.metric.valuePath
    // const start = now.toISOString()

    // get latest value record
    // let record = await this.getLastRecord(
    //   this.device.name,
    //   this.metric.valuePath,
    //   now.toISOString()
    // )
    let record = await this.getLastRecord(device, path, now.toISOString())
    console.log('Rate - last record', record)

    // if no value record, start from the beginning
    if (!record) {
      const record2 = await this.getFirstRecord(
        this.device.name,
        this.metric.deltaPath
      )
      console.log('Rate - first record', record2)
      // no delta data either, so exit
      if (!record2) {
        return
      }
      // record = { time: record2.time, value: 0}
      record = {}
      record.time = record2.time
      record.value = 0
    }

    const start = record.time.toISOString()
    const stop = now.toISOString()
    let lifetime = record.value
    // const rows = await this.getCounts(start, stop) // gets last one before start also, if any
    const rows = await this.db.getCounts(device, path, start, stop)
    let previous = rows[0]
    for (let row of rows.slice(1)) {
      const delta = row.value - previous.value
      if (delta > 0) {
        lifetime += delta
        await this.db.writeHistory(
          this.device_id,
          this.rate_id,
          row.time.toISOString(),
          lifetime
        )
      }
      previous = row
    }
    console.log(`Rate - backfill done`)
  }
}
