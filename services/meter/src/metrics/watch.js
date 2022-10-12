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
    this.lastWatchValue = undefined

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
    const deviceName = this.device.name

    // due to nature of js event loop, poll won't be called exactly every this.interval ms.
    // that means we could miss job count records in the gaps, causing 'misses'.
    // // so keep track of lastStopTime.
    // so keep track of lastRecord = { time, value }.
    // well even that didn't help...
    // need an offset to give adapter time to write data also.
    const now = new Date()
    const stopMs = now.getTime() - this.offset // ms
    const stopTime = new Date(stopMs).toISOString()
    const startTime =
      this.lastStopTime ?? new Date(stopMs - this.interval).toISOString()

    // //. merge these operations
    // if (this.metric.operation === 'accumulate') {
    //   // get values and accumulate deltas since last poll
    //   await this.accumulate()
    // } else if (this.metric.operation === 'count') {
    //   // get count of non-unavailable transitions since last poll
    //   await this.count()
    // }
    await this.accumulate()

    // save time for next poll
    // this.lastStopTime = stopTime
  }

  async accumulate() {
    //
    // // get last lifetime count, before start time
    // const record = await this.db.getLastRecord2(
    //   'history_float',
    //   this.device.name,
    //   this.metric.updatePath,
    //   startTime
    // )
    // let lifetimeCount = record ? record.value : 0
    // console.log(this.me, `last lifetime count`, lifetimeCount)

    // get counts
    // note that the function is a union that includes the record before start time.
    //. could save the trouble of the union and just keep a record of the last value - less work for db.
    // const rows = await this.db.getHistory2(
    //   'history_all',
    //   this.device.name,
    //   this.metric.watchPath,
    //   startTime,
    //   stopTime
    // )

    // getHistory3 gets records where start>=time<stop, no unions
    const rows = await this.db.getHistory3(
      'history_all',
      this.device.name,
      this.metric.watchPath,
      startTime,
      stopTime
    )
    if (rows && rows.length > 0) {
      // const record = { time: this.lastStopTime, value: this.lastLifetimeCount }
      // rows.splice(0, 0, record) // add record before start time to front of array
      rows.splice(0, 0, this.lastRecord) // add previous record to front of array
      console.log(this.me, `watch rows`, rows)

      // rows will be like (for start=10:00:00am, stop=10:00:06am)
      // time, value
      // 9:59:59am, 99
      // 10:00:00am, 100
      // 10:00:01am, 101
      // 10:00:02am, 102
      // 10:00:03am, 'UNAVAILABLE'
      // 10:00:04am, 0
      // 10:00:05am, 1
      // 10:00:06am, 2

      // build up an array of rows to write to history table
      // with { device, dataitem, time, value }
      let previousRow = rows[0] // { time, value }
      const lifetimeRows = []
      for (let row of rows.slice(1)) {
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
      console.log(this.me, `writing lifetime rows`, lifetimeRows)
      await this.db.addHistory(lifetimeRows)

      this.lastRecord = rows[rows.length - 1]
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
