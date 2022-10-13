// watch a dataitem and perform an action when value changes

// if operation is 'accumulate', will keep a running total count, eg for lifetime part counts.
// if operation is 'count', will count number of non-unavailable transitions, eg for lifetime job counts.

const metricIntervalDefault = 5 // seconds

export class Metric {
  //
  async start({ client, db, device, metric }) {
    this.client = client
    this.db = db
    this.device = device
    this.metric = metric

    this.lastStopTime = undefined
    this.lastRecord = { time: undefined, value: undefined }

    this.me = `Watch ${device.name}:`
    console.log(this.me, 'start metric', metric.watchPath, metric.updatePath)

    console.log(this.me, `get device node_id...`)
    this.device_id = await this.db.getDeviceId(device.name) // repeats until device is there

    // need this dataitemId as we'll be writing directly to the history table
    console.log(this.me, `get update dataitem_id...`)
    this.update_id = await this.db.getDataItemId(metric.updatePath) // repeat until dataitem there

    // get polling interval - either from metric in setup yaml or default value
    this.interval = (metric.interval || metricIntervalDefault) * 1000 // ms

    // look this far back in time for raw count values so adapter has time to write data.
    // this avoided a problem with missing data.
    this.offset = 3000 // ms

    // await this.backfill() // backfill any missing values
    await this.poll() // do first poll
    this.timer = setInterval(this.poll.bind(this), this.interval) // poll db
  }

  // poll db and update lifetime count - called by timer
  async poll() {
    //
    // note: due to nature of js event loop, poll won't be called exactly every this.interval ms,
    // which means we could miss job count records in the gaps, causing 'misses'.
    // so keep track of lastRecord = { time, value }
    // well even that didn't help - still had gaps.
    // so need an offset to give adapter time to write data also.
    const now = new Date()
    const stopMs = now.getTime() - this.offset // ms
    const stopTime = new Date(stopMs).toISOString()
    const startTime =
      this.lastStopTime ?? new Date(stopMs - this.interval).toISOString() // initialize if undefined

    console.log(this.me, `polling from ${startTime} to ${stopTime}`)

    let previousRow = this.lastRecord // { time, value }
    console.log(this.me, `previousRow`, previousRow)

    let lifetimeCount = this.lastRecord.value || 0

    // get records from history_all where start<=time<stop and value not 'UNAVAILABLE'
    const rows =
      (await this.db.getHistoryNonUnavailable(
        this.device.name,
        this.metric.watchPath,
        startTime,
        stopTime
      )) || []

    console.log(this.me, `watch rows`, rows)

    // rows will be like this (for start=10:00:00am, stop=10:00:06am)
    // time, value
    // 10:00:00am, 100
    // 10:00:01am, 101
    // 10:00:02am, 102
    // 10:00:03am, 'UNAVAILABLE'
    // 10:00:04am, 0
    // 10:00:05am, 1

    // build up an array of rows to write to history table
    // with { device, dataitem, time, value }
    const lifetimeRows = []
    if (this.metric.operation === 'accumulate') {
      // accumulate delta values between rows
      for (let row of rows) {
        // get delta from previous value
        const deltaCount = row.value - previousRow.value
        if (deltaCount > 0) {
          lifetimeCount += deltaCount
          const lifetimeRow = {
            node_id: this.device_id,
            dataitem_id: this.update_id,
            time: row.time.toISOString(),
            value: lifetimeCount,
          }
          lifetimeRows.push(lifetimeRow)
        }
        previousRow = row
      }
    } else if (this.metric.operation === 'count') {
      // count number of non-unavailable transitions
      for (let row of rows) {
        // check if value changed from previous row
        if (row.value !== previousRow.value) {
          lifetimeCount += 1
          const lifetimeRow = {
            node_id: this.device_id,
            dataitem_id: this.update_id,
            time: row.time.toISOString(),
            value: lifetimeCount,
          }
          lifetimeRows.push(lifetimeRow)
        }
        previousRow = row
      }
    }

    if (lifetimeRows.length > 0) {
      console.log(this.me, `writing lifetime rows`, lifetimeRows)
      await this.db.addHistory(lifetimeRows)
      // save last record for next poll
      this.lastRecord = rows[rows.length - 1]
    } else {
      console.log(this.me, `no lifetime rows to write`)
      // leave lastRecord unchanged
    }
  }

  //   // backfill missing partcount records
  //   async backfill() {
  //     const deviceName = this.device.name
  //     console.log(this.me, `backfill any missed partcounts`)

  //     const now = new Date()

  //     // get latest lifetime count record
  //     let record = await this.db.getLastRecord(
  //       deviceName,
  //       this.metric.updatePath,
  //       now.toISOString()
  //     )
  //     console.log(this.me, `last record`, record)

  //     // if no lifetime record, start from the beginning
  //     if (!record) {
  //       const record2 = await this.db.getFirstRecord(
  //         deviceName,
  //         this.metric.watchPath
  //       )
  //       console.log(this.me, `first record`, record2)
  //       // no delta data either, so exit
  //       if (!record2) {
  //         return
  //       }
  //       // record = { time: record2.time, value: 0}
  //       record = {}
  //       record.time = record2.time
  //       record.value = 0
  //     }

  //     const start = record.time.toISOString()
  //     const stop = now.toISOString()
  //     let lifetime = record.value
  //     const rows = await this.db.getHistory(
  //       deviceName,
  //       this.metric.watchPath,
  //       start,
  //       stop
  //     ) // gets last one before start also, if any
  //     let previous = rows[0]
  //     for (let row of rows.slice(1)) {
  //       const delta = row.value - previous.value
  //       if (delta > 0) {
  //         lifetime += delta
  //         await this.db.writeHistory(
  //           this.device_id,
  //           this.update_id,
  //           row.time.toISOString(),
  //           lifetime
  //         )
  //       }
  //       previous = row
  //     }
  //     console.log(this.me, `backfill done`)
  //   }
}
