// read a counter and write the lifetime count

// the counter can be reset any time, but the lifetime count
// will keep increasing.

//. this will be replaced by watch.js, which is a little more generic and efficient.

const metricIntervalDefault = 5000 // ms
const metricOffsetDefault = 3000 // ms

export class Metric {
  //
  async start({ client, db, device, metric }) {
    this.client = client
    this.db = db
    this.device = device
    this.metric = metric

    this.interval = metric.interval ?? metricIntervalDefault // ms
    this.offset = metric.offset ?? metricOffsetDefault // ms
    this.lastStop = null
    this.lastWatchValue = undefined

    this.me = `Count ${device.name}:`
    console.log(this.me, `start metric, watch`, metric.deltaPath)

    console.log(this.me, `get device node_id...`)
    this.device_id = await this.db.getDeviceId(device.name) // repeats until device is there

    // need this dataitemId as we'll be writing directly to the history table
    console.log(this.me, `get dataitem_id...`)
    this.lifetime_id = await this.db.getDataItemId(metric.lifetimePath) // repeat until dataitem there

    await this.backfill() // backfill any missing values
    await this.poll() // do first poll
    this.timer = setInterval(this.poll.bind(this), this.interval) // poll db
  }

  //

  // poll db and update lifetime count - called by timer
  async poll() {
    //
    const deviceName = this.device.name
    // console.log(this.me, `poll db, write lifetime count`)

    // due to nature of js event loop, poll is not gonna be called exactly every this.interval ms.
    // that means we could miss job count records, causing 'misses'.
    // so keep track of lastStop.
    // well that didn't help. so add an offset to give adapter time to write data.
    const now = new Date()
    const start =
      this.lastStop ||
      new Date(now.getTime() - this.offset - this.interval).toISOString()
    const stop = new Date(now.getTime() - this.offset).toISOString()
    const lifetimePath = this.metric.lifetimePath
    // console.log(this.me, `start,stop`, start, stop)

    // get last lifetime count, before start time
    const record = await this.db.getLastRecord(deviceName, lifetimePath, start)
    let lifetimeCount = record ? record.value : 0
    // console.log(this.me, `lifetimeCount`, lifetimeCount)

    // get job counts - includes last one before start time, if any, using a UNION query.
    //. currently gets from history_float view
    const rows = await this.db.getHistory(
      deviceName,
      this.metric.deltaPath,
      start,
      stop
    )
    // console.log(this.me, `job count rows`, rows)
    // rows will be like (for start=10:00:00am, stop=10:00:05am)
    // time, value
    // 9:59:59am, 99
    // 10:00:00am, 100
    // 10:00:01am, 101
    // 10:00:02am, 102
    // 10:00:03am, 0
    // 10:00:04am, 1
    // 10:00:05am, 2
    // note: if we only got 1 row, it would be the last one before start time,
    // ie no new counts since last poll - because getHistory gets last one before start time also.
    if (rows && rows.length > 1) {
      let previousRow = rows[0] // { time, value }
      const lifetimeRows = []
      for (let row of rows.slice(1)) {
        // get delta from previous value
        const deltaCount = row.value - previousRow.value
        if (deltaCount > 0) {
          lifetimeCount += deltaCount
          const lifetimeRow = {
            node_id: this.device_id,
            dataitem_id: this.lifetime_id,
            time: row.time.toISOString(),
            value: lifetimeCount,
          }
          lifetimeRows.push(lifetimeRow)
        }
        previousRow = row
      }
      // console.log(this.me, `writing lifetime rows`, lifetimeRows)
      await this.db.addHistory(lifetimeRows)
    }
    // save time for next poll
    this.lastStop = stop
  }

  //

  // backfill missing partcount records
  async backfill() {
    const deviceName = this.device.name
    console.log(this.me, `backfill any missed partcounts`)

    const now = new Date()

    // get latest lifetime count record
    let record = await this.db.getLastRecord(
      deviceName,
      this.metric.lifetimePath,
      now.toISOString()
    )
    console.log(this.me, `last record`, record)

    // if no lifetime record, start from the beginning
    if (!record) {
      const record2 = await this.db.getFirstRecord(
        deviceName,
        this.metric.deltaPath
      )
      console.log(this.me, `first record`, record2)
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
    console.log(this.me, `backfill done`)
  }
}
