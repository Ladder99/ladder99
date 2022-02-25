// read partcounts and write lifetime partcounts

const metricIntervalDefault = 5 // seconds

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
    console.log(`Partcounts - initialize partcounts metric...`)
    this.client = client
    this.db = db
    this.device = device
    this.metric = metric

    console.log(`Partcounts - get device node_id...`)
    this.device_id = await this.db.getDeviceId(device.name) // repeats until device is there
    console.log('Partcounts - device', this.device)

    // need this dataitemId as we'll be writing directly to the history table
    this.lifetime_id = await this.db.getDataItemId(metric.lifetimePath) // repeat until dataitem there
    console.log('Partcounts - lifetime_id', this.lifetime_id)

    // get polling interval - either from metric in setup yaml or default value
    this.interval = (metric.interval || metricIntervalDefault) * 1000 // ms

    await this.backfill() // backfill missing values
    await this.poll() // do first poll
    this.timer = setInterval(this.poll.bind(this), this.interval) // poll db
  }

  // poll db and update lifetime count - called by timer
  async poll() {
    console.log('Partcounts - poll db and write lifetime counts ')

    const now = new Date()
    const start = new Date(now.getTime() - this.interval)
    const stop = now

    // get last lifetime value, before start time
    let lifetime = await this.getLastRecord(
      this.device.name,
      this.metric.lifetimePath,
      start.toISOString()
    )
    console.log('Partcounts - lifetime', lifetime)

    const rows = await this.getPartCounts(start, stop)
    console.log('Partcounts - rows', rows)
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
          await this.writeHistory(
            this.device_id,
            this.lifetime_id,
            row.time,
            lifetime
          )
        }
        previous = row
      }
    }
  }

  // write a record to the history table
  // time should be an ISO datetime string
  async writeHistory(device_id, dataitem_id, time, value) {
    const sql = `
      insert into history (node_id, dataitem_id, time, value)
      values (${device_id}, ${dataitem_id}, '${time}', ${value});
    `
    console.log('Partcounts - write', device_id, dataitem_id, time, value)
    // console.log('writeHistory', sql)
    // await this.db.query(sql)
  }

  // get partcount records from history_float.
  // start and stop should be Date objects.
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

  // get last value of a path from history_float view, before a given time.
  // start should be an ISO datetimestring
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
    const record = result.rows.length > 0 && result.rows[0] // null or { time, value }
    return record
  }

  // backfill missing partcount records
  async backfill() {
    console.log(`Partcounts - backfill any missed partcounts...`)

    const now = new Date()

    // get latest lifetime count record
    const record = await this.getLastRecord(
      this.device.name,
      this.metric.lifetimePath,
      now.toISOString()
    )

    if (record && record.length > 0) {
      const start = record.time
      let lifetime = record.value
      const stop = now
      const rows = await this.getPartCounts(start, stop) // gets last one before start also, if any
      let previous = rows[0]
      for (let row of rows.slice(1)) {
        const delta = row.value - previous.value
        lifetime += delta
        await this.writeHistory(
          this.device_id,
          this.lifetime_id,
          // new Date(row.time).toISOString(),
          row.time,
          lifetime
        )
        previous = row
      }
      console.log(`Partcounts - backfill done`)
    }
  }
}
