// watch a dataitem value and do some action on change

// in setup.yaml, add a section like this:

// meter:
//   watch:
//     watchPath: processes/job/process_aggregate_id-order_number
//     updatePath: process/life/cycle_count-all
//     operation: increment

const metricIntervalDefault = 5 // seconds

export class Metric {
  //
  async start({ client, db, device, metric }) {
    this.client = client
    this.db = db
    this.device = device
    this.metric = metric
    this.lastWatchValue = null

    this.me = `Watch ${this.device.name}:`
    console.log(this.me, `path is ${this.metric.watchPath}`)

    // get node_ids since we'll be writing directly to history table
    console.log(this.me, `get device and dataitem node_ids...`)
    //. made getNodeId method in historian branch
    this.device_id = await this.db.getDeviceId(device.name) // repeats until device is there
    this.update_id = await this.db.getDataItemId(metric.updatePath) // repeat until dataitem is there

    // get polling interval - either from metric in setup yaml or default value
    this.interval = (metric.interval || metricIntervalDefault) * 1000 // ms

    this.offset = 3000 // ms - look this far back in time for raw count values so adapter has time to write data

    await this.poll() // do first poll
    this.timer = setInterval(this.poll.bind(this), this.interval) // poll db
  }

  async poll() {
    //
    //. could be watching a number, or string - this returns a json object?
    const currentWatchValue = await this.db.getLatestValue(
      'history_all',
      this.device, // has { name }
      this.metric.watchPath
    )

    // initialize saved watch value if needed - prevents immediate action on startup
    this.lastWatchValue = this.lastWatchValue || currentWatchValue

    // check if watch value changed - if so, do action
    if (currentWatchValue !== this.lastWatchValue) {
      if (this.metric.operation === 'increment') {
        const value =
          (await this.db.getLatestValue(
            'history_float',
            this.device, // has { name }
            this.metric.updatePath
          )) || 0
        const newValue = value + 1
        console.log(
          this.me,
          `incrementing ${this.metric.updatePath} to ${newValue}`
        )
        await this.db.writeHistory(
          this.device_id,
          this.update_id,
          new Date().toISOString(),
          newValue
        )
      }
      // save watch value
      this.lastWatchValue = currentWatchValue
    }
  }
}
