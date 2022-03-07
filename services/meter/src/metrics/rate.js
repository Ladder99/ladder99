// rate metric
// read values and write the rate of change between them
// eg can use to get the production rate from a counter

const metricIntervalDefault = 5 // seconds

export class Metric {
  //
  async start({ client, db, device, metric }) {
    console.log(`Rate - initialize metric...`)
    this.client = client
    this.db = db
    this.device = device
    this.metric = metric

    console.log(`Rate - get device node_id...`)
    this.device_id = await this.db.getDeviceId(device.name) // repeats until device is there

    // need this dataitemId as we'll be writing directly to the history table
    console.log(`Rate - get rate dataitem_id...`)
    this.rate_id = await this.db.getDataItemId(metric.ratePath) // repeat until dataitem there

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

    // get last value before now
    let value = 0
    const record = await this.db.getLastRecord(device, path, stop)
    if (record) {
      value = record.value
    }
    console.log('Rate - last value', value)

    // get value history
    //. could pass n records to get before start time, eg 3
    const rows = await this.db.getHistory(device, path, start, stop)
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

  // backfill any missing rate records
  async backfill() {
    console.log(`Rate - backfill any missing rate records...`)

    const now = new Date()

    const device = this.device.name
    const path = this.metric.valuePath

    // get latest value record
    let record = await this.db.getLastRecord(device, path, now.toISOString())
    console.log('Rate - last record', record)

    // if no value record, start from the beginning
    if (!record) {
      const record2 = await this.db.getFirstRecord(device, path)
      console.log('Rate - first record', record2)
      // no delta data either, so exit
      if (!record2) {
        return
      }
      record = { time: record2.time, value: 0 }
    }

    const start = record.time.toISOString()
    const stop = now.toISOString()
    let lifetime = record.value
    const rows = await this.db.getHistory(device, path, start, stop) // gets last one before start also, if any
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
