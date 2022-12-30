// update bins records based on values in history table.
// eg keep track of total part counts over different time intervals - minute, hour, day.

import * as bins from '../bins.js'

const meterIntervalDefault = 5 // seconds

export class Metric {
  //
  async start({ client, db, device, meter }) {
    this.me = `Bin ${device.name} -`
    console.log(this.me, `start`)

    this.client = client
    this.db = db
    this.device = device
    this.meter = meter

    this.lastStop = null
    this.lastCount = null

    // get this so can write to raw.bin table
    console.log(this.me, `get device node_id...`)
    this.device_id = await this.db.getNodeId(device.path) // repeats until device is there

    // get polling interval - either from meter in setup yaml or default value
    this.interval = (meter.interval || meterIntervalDefault) * 1000 // ms

    // look this far back in time for raw count values so adapter has time to write data
    this.offset = 3000 // ms

    // await this.backfill() // backfill any missing values
    await this.poll() // do first poll
    this.timer = setInterval(this.poll.bind(this), this.interval) // poll db
  }

  // poll db and update part count bins - called by timer
  async poll() {
    console.log(this.me, `poll db, write count bins`)

    // due to nature of js event loop, poll is not gonna be called exactly every this.interval ms.
    // that means we could miss job count records, causing 'misses'.
    // so keep track of lastStop.
    // well that didn't help. so use this.offset to give adapter time to write data.
    const now = new Date()
    const start =
      this.lastStop ||
      new Date(now.getTime() - this.offset - this.interval).toISOString()
    const stop = new Date(now.getTime() - this.offset).toISOString()
    console.log(this.me, `start,stop`, start, stop)

    const { countPath, binColumn } = this.meter

    // get latest count value
    //. bad - if count hasn't been updated in a long time, this could be slow!
    const record = await this.db.getLastRecord(
      this.device.name,
      countPath,
      stop
    )
    let latestCount = record ? record.value : 0

    // get delta
    const deltaCount = latestCount - this.lastCount

    if (deltaCount > 0) {
      await bins.add(this.db, this.device.node_id, now, binColumn, deltaCount)
    }

    // save time for next poll
    this.lastStop = stop
  }

  // backfill missing bin records
  async backfill() {}
}
