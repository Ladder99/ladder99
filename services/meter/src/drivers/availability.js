// read/write values for device availability calculations, where

// availability = time machine is active / time machine is available for use.
// active = part_count changed in previous time period.
// available = current time is within the schedule for the machine.

// availability is also called utilization in some client setups

// in client's setup.yaml, need something like this -
// meters:
//   # availability
//   # gets active = time machine was active in previous time period,
//   # based on part count changes, and available = time is within start/stop schedule.
//   availability:
//     driver: availability
//     activePath: Controller/Path/PartCountAll

// driver = availability will cause this js plugin to be loaded.
// then this code uses the given paths to look in the database for
// activity and schedule information.
// it then writes out the availability metric for each minute, hour, day, etc.

// each minute will have a value 0 or 1, because we have to choose some
// unit of time to look at the activity of a machine to say if it was 'active'
// or not, and a minute seems like a good unit for these big machines.
//. (or could pass base time unit in setup yaml)
// and if it's active, it will also increment the current hour, day, month, year bins.
// this lets us look at the timeline at different resolutions in the dashboard.

// if the current time is within the machine's schedule, it will similarly
// increment the minute, hour, day, etc bins for 'available'.

// to calculate the 'availability' percentage, the metrics view in the db
// does 'active' / 'available'.

import * as bins from '../bins.js'

const metricIntervalDefault = 60 // seconds

export class Metric {
  //
  async start({ db, client, device, meter }) {
    this.me = `Availability ${device.path}:`
    console.log(this.me, `start`, meter)

    this.db = db
    this.client = client // { timezone, ... }
    this.device = device // { path, ... }
    this.meter = meter // { activePath, interval, ... }

    this.timezone = client.timezone

    this.activeFullPath = `${device.path}/${meter.activePath}`

    console.log(this.me, `getting device node_id for ${device.path}...`)
    this.device.node_id = await this.db.getNodeId(device.path) // repeats until device is there
    console.log(this.me, `node_id`, this.device.node_id)

    // get polling interval - either from metric in setup yaml or default value
    this.intervalMs = (meter.interval || metricIntervalDefault) * 1000 // ms

    // do first poll and start timer
    await this.poll()
    this.timer = setInterval(this.poll.bind(this), this.intervalMs)
  }

  // poll db and update bins
  async poll() {
    console.log(this.me, `poll db and update bins`)

    const now = new Date() // eg 2022-01-13T12:00:00.000Z - js dates are stored in Z/UTC

    // increment active bins if device was active in previous time interval.
    // handle overtime by allowing active minutes outside of shift hours -
    // this means availability can theoretically be > 100%.
    const start =
      this.previousStopTime || new Date(now.getTime() - this.intervalMs)
    const stop = now
    const deviceWasActive = await this.getActive(start, stop)
    if (deviceWasActive) {
      console.log(this.me, `increasing active bin`)
      await bins.add(this.db, this.device.node_id, now, 'active')
    }

    // increment available bins if we're within the schedule for the device and not in a downtime.
    const isDuringShift = this.schedule.isDuringShift()
    if (isDuringShift) {
      console.log(this.me, now, `- increasing available bin`)
      await bins.add(this.db, this.device.node_id, now, 'available')
    }

    this.previousStopTime = stop
  }

  // check if device was 'active' (ie has events on the active path), between two times.
  // returns true/false.
  async getActive(start, stop) {
    //. use $1, $2 etc
    const sql = `
      select count(value) > 0 as active
      from history_float
      where
        device = '${this.device.path}'
        and path = '${this.activeFullPath}'
        and time between '${start.toISOString()}' and '${stop.toISOString()}'
      limit 1;
    `
    const result = await this.db.query(sql)
    const deviceWasActive = result?.rows[0]?.active // t/f - column name must match case
    return deviceWasActive
  }
}
