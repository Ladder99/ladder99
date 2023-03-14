// update bins records based on values in history table.
// eg keep track of total part counts over different time intervals - minute, hour, day.

import * as bins from '../bins.js'

// poll db every this many seconds
const meterIntervalDefault = 2 // seconds

// look this far back in time for raw count values so adapter has time to write data
const delayMs = 2000

export class Metric {
  //
  async start({ db, schedule, client, device, meter }) {
    this.me = `Bin ${device.path} for meter ${meter.key}:`
    console.log(this.me, `start`)

    this.db = db
    this.schedule = schedule
    this.client = client
    this.device = device
    this.meter = meter

    this.countPath = `${device.path}/${meter.countPath}` // eg 'Main/ConversionPress/...'

    // this.lastStopTime = null
    this.lastCount = null

    // get this so can write to raw.bin table
    console.log(this.me, `wait to get device node_id...`)
    this.device_id = await this.db.getNodeId(device.path) // repeats until device is there

    // get polling interval - either from meter in setup yaml or default value
    this.interval = (meter.interval || meterIntervalDefault) * 1000 // ms

    await this.poll() // do first poll
    this.timer = setInterval(this.poll.bind(this), this.interval) // poll db
  }

  // poll db and update part count bins - called by timer
  async poll() {
    const now = new Date()
    // console.log(this.me, `poll db, write count bins at`, now)

    // look in past a bit so adapter has time to write data
    // const stopTime = this.lastStopTime ?? new Date(now.getTime() - delayMs)
    const stopTime = new Date(now.getTime() - delayMs)
    // const stopTime = this.lastStopTime ?? now
    console.log(this.me, `stopTime`, stopTime)

    // don't update part count bins if not in shift or in downtime
    if (!this.schedule.isDuringShift(stopTime)) {
      console.log(this.me, stopTime, `not in shift`)
      return
    }

    // get latest count value
    //. if count hasn't been updated in a long time, this could be slow,
    // unless we get the index working better.
    // console.log(this.me, `get latest count value`)
    const record = await this.db.getLastRecord(
      this.device.path,
      this.countPath,
      stopTime
    )
    console.log(this.me, `got record`, record)

    if (record) {
      let currentCount = record.value
      console.log(this.me, `currentCount`, currentCount)

      // get delta (zero for first encounter)
      let deltaCount = currentCount - (this.lastCount ?? currentCount)
      console.log(this.me, `deltaCount`, deltaCount)

      // bug - had this AFTER the await below, so if db was slow, deltaCount would keep increasing.
      this.lastCount = currentCount

      // handle rollover and counter resets
      // might lose some counts if counter resets to 0 before we get a chance to read it
      if (deltaCount < 0) {
        console.log(this.me, `count reset (delta < 0)`)
        //. problem - on first read, could dump thousands into minute bin - just use 0?
        // deltaCount = currentCount
        deltaCount = 0
      }

      if (deltaCount > 0) {
        const binColumn = this.meter.binColumn // eg 'total_count'
        console.log(this.me, `add to bins col`, binColumn, 'delta', deltaCount)
        await bins.add(this.db, this.device_id, stopTime, binColumn, deltaCount)
      }
    }

    // this.lastStopTime = stopTime
  }
}
