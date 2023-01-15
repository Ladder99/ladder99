// update bins records based on values in history table.
// eg keep track of total part counts over different time intervals - minute, hour, day.

import * as bins from '../bins.js'

const meterIntervalDefault = 5 // seconds

export class Metric {
  //
  async start({ client, db, device, meter }) {
    this.me = `Bin ${device.path} -`
    console.log(this.me, `start`)

    this.client = client
    this.db = db
    this.device = device
    this.meter = meter

    this.countPath = `${device.path}/${meter.countPath}`

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
    //. lame that there's such a delay - need to move all this into more reactive adapter.
    const now = new Date()
    const stop = new Date(now.getTime() - this.offset).toISOString()

    const binColumn = this.meter.binColumn // eg 'total_count'

    // get latest count value
    //. if count hasn't been updated in a long time, this could be slow,
    // unless we get the index working better.
    const record = await this.db.getLastRecord(
      this.device.path,
      this.countPath,
      stop
    )

    if (record) {
      let currentCount = record.value

      // get delta (zero for first encounter)
      let deltaCount = currentCount - (this.lastCount ?? currentCount)

      //. handle flipping over to 0 - eg if currentCount=2, lastCount=97, deltaCount=-95, but delta should be 5
      // so if deltaCount is negative, add max value to it.
      //. but we're also handling good/bad/reject counts, which might reset when total resets also.
      //. actual value depends on the max value of the counter - 100, 1000, 10000?
      // if (deltaCount < 0) {
      //   console.log(this.me, `count reset to 0`)
      //   deltaCount = rollover - deltaCount
      // }

      // handle rollover and counter resets
      // might lose some counts if counter resets to 0 before we get a chance to read it
      if (deltaCount < 0) {
        console.log(this.me, `count reset (delta < 0)`)
        deltaCount = currentCount
      }

      if (deltaCount > 0) {
        console.log(this.me, `add to bins`, binColumn, deltaCount)
        await bins.add(this.db, this.device_id, now, binColumn, deltaCount)
      }

      this.lastCount = currentCount
    }

    this.lastStop = stop
  }

  // backfill missing bin records
  async backfill() {}
}
