// read a counter and write the lifetime count

// ie the counter can be reset any time, but the lifetime count
// will keep increasing.

const metricIntervalDefault = 5 // seconds

export class Metric {
  //
  async start({ client, db, device, metric }) {
    this.client = client
    this.db = db
    this.device = device
    this.metric = metric
    this.lastTimestamp = null

    const deviceName = this.device.name
    console.log(`Count ${deviceName} - start metric...`)

    console.log(`Count ${deviceName} - get device node_id...`)
    this.device_id = await this.db.getDeviceId(device.name) // repeats until device is there

    // need this dataitemId as we'll be writing directly to the history table
    console.log(`Count ${deviceName} - get dataitem_id...`)
    this.lifetime_id = await this.db.getDataItemId(metric.lifetimePath) // repeat until dataitem there

    // get polling interval - either from metric in setup yaml or default value
    this.interval = (metric.interval || metricIntervalDefault) * 1000 // ms

    await this.backfill() // backfill any missing values
    await this.poll() // do first poll
    this.timer = setInterval(this.poll.bind(this), this.interval) // poll db
  }

  // poll db and update lifetime count - called by timer
  async poll() {
    const deviceName = this.device.name
    console.log(`Count ${deviceName} - poll db, write lifetime count`)

    // due to nature of js event loop, poll is not gonna be called exactly every this.interval ms.
    // that means we could miss job count records, causing 'misses'.
    const now = new Date()
    // const start = new Date(now.getTime() - this.interval).toISOString()
    const start =
      this.lastTimestamp ||
      new Date(now.getTime() - this.interval).toISOString()
    const stop = now.toISOString()
    const path = this.metric.lifetimePath
    console.log(`Count ${deviceName} - start,stop`, start, stop)

    // get last lifetime value, before start time
    let lifetime = 0
    const record = await this.db.getLastRecord(deviceName, path, start)
    if (record) {
      lifetime = record.value
    }
    console.log(`Count ${deviceName} - lifetime`, lifetime)

    // get job counts
    const rows = await this.db.getHistory(
      deviceName,
      this.metric.deltaPath,
      start,
      stop
    )
    console.log(`Count ${deviceName} - rows`, rows)
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
          lifetime += delta
          // write time, lifetime
          await this.db.writeHistory(
            this.device_id,
            this.lifetime_id,
            row.time.toISOString(),
            lifetime
          )
        }
        previous = row
      }
    }
    // save time for next poll
    this.lastTimestamp = stop
  }

  // backfill missing partcount records
  async backfill() {
    const deviceName = this.device.name
    console.log(`Count ${deviceName} - backfill any missed partcounts`)

    const now = new Date()

    // get latest lifetime count record
    let record = await this.db.getLastRecord(
      deviceName,
      this.metric.lifetimePath,
      now.toISOString()
    )
    console.log(`Count ${deviceName} - last record`, record)

    // if no lifetime record, start from the beginning
    if (!record) {
      const record2 = await this.db.getFirstRecord(
        deviceName,
        this.metric.deltaPath
      )
      console.log(`Count ${deviceName} - first record`, record2)
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
    const rows = await this.db.getHistory(
      deviceName,
      this.metric.deltaPath,
      start,
      stop
    ) // gets last one before start also, if any
    let previous = rows[0]
    for (let row of rows.slice(1)) {
      const delta = row.value - previous.value
      if (delta > 0) {
        lifetime += delta
        await this.db.writeHistory(
          this.device_id,
          this.lifetime_id,
          row.time.toISOString(),
          lifetime
        )
      }
      previous = row
    }
    console.log(`Count ${deviceName} - backfill done`)
  }
}
