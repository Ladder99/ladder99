// read/write values for device availability calculations

const metricInterval = 60 // seconds
const resolutions = 'minute,hour,day,week,month,year'.split(',')

export class Metric {
  constructor() {
    this.device = null
    this.metric = null
    this.db = null
    this.interval = null
    this.timer = null
  }

  async start({ client, db, device, metric }) {
    console.log(`Meter - initialize availability metric...`)
    this.client = client
    this.db = db
    this.device = device
    this.metric = metric

    // repeat until device has been added to db
    console.log(`Meter - get device node_id...`)
    this.device.node_id = await this.getDeviceId()
    console.log(this.device)

    console.log(`Meter - update bins...`)
    await this.updateBins()

    // start the timer which calls updateBins every n seconds -
    // it will increment bins as needed.
    // eg a partcount event indicates device was active during that minute.
    console.log(`Meter - start updateBins timer...`)
    this.interval = metric.interval || metricInterval
    this.timer = setInterval(this.updateBins.bind(this), this.interval * 1000) // ms
  }

  async getDeviceId() {
    let result
    while (true) {
      const sql = `select node_id from devices where name='${this.device.name}'`
      console.log(sql)
      result = await this.db.query(sql)
      if (result.rows.length > 0) break
      await new Promise(resolve => setTimeout(resolve, 4000)) // wait 4 secs
    }
    return result.rows[0].node_id
  }

  // update bins - called by timer
  async updateBins() {
    console.log('Meter - update bins')
    const now = new Date()
    // shift now into server timezone (GMT) so can do comparisons properly
    // const now = new Date(
    //   new Date().getTime() +
    //     (this.client.timezoneOffsetHrs || 0) * 60 * 60 * 1000
    // )
    console.log('Meter - now', now)

    // get schedule for device, eg { start: '2022-01-13 05:00:00', stop: ... }
    console.log(`Meter - get schedule...`)

    //. do this every 5mins or so on separate timer
    const schedule = await this.getSchedule()

    // check if we're within scheduled time
    const scheduled = now >= schedule.start && now <= schedule.stop
    if (scheduled) {
      console.log(`Meter - in scheduled time window - check if active...`)
      // if so, check for events in previous n secs, eg 60
      const start = new Date(now.getTime() - this.interval * 1000)
      const stop = now
      const deviceWasActive = await this.getActive(start, stop)
      // if device was active, increment the active bin
      if (deviceWasActive) {
        console.log(`Meter - device was active, increment active bin`)
        await this.incrementBins(now, 'active')
      }
      // always increment the available bin
      console.log(`Meter - always increment the available bin`)
      await this.incrementBins(now, 'available')
    } else {
      console.log(`Meter - not in scheduled time window`)
    }
  }

  // query db for start and stop datetime dataitems.
  // converts the timestrings to local time for the client.
  //. will want to pass an optional datetime for the date to search for.
  async getSchedule() {
    const table = 'history_text'
    const device = this.device
    const client = this.client
    const { startPath, stopPath } = this.metric
    // note: these can return 'UNAVAILABLE' or 'HOLIDAY', in which case,
    // schedule.start etc will be 'Invalid Date'.
    // any comparison with those will yield false.
    const start = await this.db.getLatestValue(table, device, startPath)
    const stop = await this.db.getLatestValue(table, device, stopPath)
    // shift these by client timezoneOffsetHrs, as need them for comparisons
    const schedule = {
      start: new Date(
        new Date(start).getTime() - client.timezoneOffsetHrs * 60 * 60 * 1000
      ),
      stop: new Date(
        new Date(stop).getTime() - client.timezoneOffsetHrs * 60 * 60 * 1000
      ),
    }
    console.log('schedule', schedule)
    return schedule
  }

  // // backfill the active and available field bins
  // async backfill() {
  //   //
  // }

  // check if device was 'active' (ie has events on the active path), between two times.
  // returns true/false
  async getActive(start, stop) {
    const sql = `
    select count(value) > 0 as active
    from history_all
    where
      device = '${this.device.name}'
      and path = '${this.metric.activePath}'
      and time between '${start.toISOString()}' and '${stop.toISOString()}'
    limit 1;
    `
    console.log(sql)
    const result = await this.db.query(sql)
    const deviceWasActive = result.rows[0].active // t/f
    return deviceWasActive
  }

  // increment values in the bins table.
  // rounds the given time down to nearest min, hour, day, week etc,
  // and increments the given field for each.
  // field is eg 'active', 'available'.
  // const sql = `call increment_bins(${device_id}, '${time.toISOString()}', '${field}');`
  //     v_time := date_trunc(v_resolution, p_time); -- round down to start of current min, hour, day, etc
  //       'insert into bins (device_id, resolution, time, %s)
  //         values ($1, $2, $3, $4)
  //       on conflict (device_id, resolution, time) do
  //         update set %s = coalesce(bins.%s, 0) + $5;',
  //       v_field, v_field, v_field
  //     ) using p_device_id, ('1 '||v_resolution)::interval, v_time, p_delta, p_delta;
  async incrementBins(time, field, delta = 1) {
    const timeISO = time.toISOString()
    for (let resolution of resolutions) {
      // upsert/increment the given field by delta
      const sql = `
      insert into bins (device_id, resolution, time, ${field})
        values (
          ${this.device.node_id}, 
          ('1 '||'${resolution}')::interval, 
          date_trunc('${resolution}', '${timeISO}'::timestamptz), 
          ${delta}
        )
      on conflict (device_id, resolution, time) do
        update set ${field} = coalesce(bins.${field}, 0) + ${delta};
      `
      console.log(sql)
      await this.db.query(sql)
    }
  }
}
