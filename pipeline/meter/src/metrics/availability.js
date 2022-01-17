export class Metric {
  constructor() {
    this.device = null
    this.metric = null
    this.postgres = null
    this.interval = null
    this.timer = null
  }

  async start({ device, metric, postgres }) {
    console.log(`Meter - initialize availability metric...`)
    this.device = device
    this.metric = metric
    this.postgres = postgres

    // this.device.node_id = await getDeviceId(postgres, device)

    // start the timer which calls updateBins every n seconds -
    // it will increment bins as needed.
    // eg a partcount event indicates device was active during that minute.
    console.log('Meter - start timer')
    this.interval = metric.interval || 60 // seconds
    this.timer = setInterval(this.updateBins.bind(this), this.interval * 1000) // ms
  }

  // update bins - called by timer
  async updateBins() {
    console.log('Metric - updateBins')
    const now = new Date()
    console.log('now', now)

    // get schedule for device, eg { start: '2022-01-13 05:00:00', stop: ... }
    //. do this every 5mins or so
    const schedule = await this.getSchedule()

    // check if we're within scheduled time
    const scheduled = now >= schedule.start && now <= schedule.stop
    if (scheduled) {
      // check for events in previous n secs
      const start = new Date(now.getTime() - this.interval * 1000)
      const stop = now
      const deviceWasActive = await this.getActive(start, stop)
      if (deviceWasActive) {
        await this.incrementBins(now, 'active')
      }
      await this.incrementBins(now, 'available')
    }
  }

  // query postgres for start and stop datetime dataitems
  async getSchedule() {
    const table = 'history_text'
    const { name } = this.device
    const { startPath, stopPath } = this.metric
    const start = await this.postgres.getLatestValue(table, name, startPath)
    const stop = await this.postgres.getLatestValue(table, name, stopPath)
    // const schedule = { start, stop }
    const schedule = { start: new Date(start), stop: new Date(stop) }
    console.log('schedule', schedule)
    return schedule
  }

  // backfill the active and available field bins
  async backfill() {
    //
  }

  // check if device was 'active' (ie has events on the given path),
  // between two times. returns true/false
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
    const result = await this.postgres.query(sql)
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
  async incrementBins(device_id, time, field, delta = 1) {
    const timeISO = time.toISOString()
    const resolutions = 'minute,hour,day,week,month,year'.split(',')
    for (let resolution of resolutions) {
      // upsert/increment the given field by delta
      const sql = `
      insert into bins (device_id, resolution, time, ${field})
        values (
          ${device_id}, 
          ('1 '||'${resolution}')::interval, 
          date_trunc('${resolution}', '${timeISO}'::timestamptz), 
          ${delta}
        )
      on conflict (device_id, resolution, time) do
        update set ${field} = coalesce(bins.${field}, 0) + ${delta};
      `
      console.log(sql)
      await this.postgres.query(sql)
    }
  }
}

// async function getDeviceId(postgres, device) {
//   const sql = `select node_id from devices where name='${device.name}'`
//   const result = await postgres.query(sql)
//   const deviceId = result.rows[0].node_id
//   return deviceId
// }
