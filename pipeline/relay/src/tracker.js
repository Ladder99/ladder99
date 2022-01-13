// Track events every n seconds and increment bins as needed.

//. what if had one tracker per device? might need that.

//. pass in through constructor, with devices and metrics to track.
//. which should come from a client yaml file. metrics.yaml?
const path = 'controller/partOccurrence/part_count-all'
const startpath = 'processes/process_time-start'
const stoppath = 'processes/process_time-complete'

export class Tracker {
  // db is a Db object, setup is the client setup.yaml contents
  constructor(db, setup) {
    this.db = db
    this.setup = setup
    this.dbTimer = null
    this.devices = []
  }

  // save list of devices associated with this setup.
  // these are augmented, so have .node_id from the db.
  // build a lookup table from .name to .node_id.
  setDevices(devices) {
    console.log('setDevices', devices)
    this.devices = devices
    this.deviceIds = {}
    for (let device of devices) {
      this.deviceIds[device.name] = device.node_id
    }
    console.log('deviceIds', this.deviceIds)
  }

  // start the timer which calls updateBins every n seconds -
  // it will increment bins as needed.
  // eg a partcount event indicates device was active during that minute.
  startTimer(dbInterval) {
    console.log('startTimer')
    this.dbTimer = setInterval(this.updateBins.bind(this), dbInterval * 1000)
    this.dbInterval = dbInterval // save for later
  }

  // query db for start and stop datetime dataitems for given device.
  // just need the regular device name as defined in setup and
  // used in postgres, eg 'Marumatsu'.
  async getSchedule(device) {
    const table = 'history_text'
    const start = await this.db.getLatestValue(table, device, startpath)
    const stop = await this.db.getLatestValue(table, device, stoppath)
    const schedule = { start, stop }
    console.log('schedule', schedule)
    return schedule
  }

  // update bins - called by timer
  async updateBins() {
    console.log('updateBins')
    const now = new Date()
    console.log('now', now)
    // iterate over devices
    for (let device of this.setup.devices) {
      // we only want to track devices with a metrics object
      if (device.metrics) {
        // get schedule for this device, eg { start: '2022-01-13 05:00:00', stop: ... }
        const schedule = await this.getSchedule(device)
        // check if now is within scheduled time
        // const scheduled = now >= schedule.start && now <= schedule.stop
        const scheduled =
          now >= new Date(schedule.start) && now <= new Date(schedule.stop)
        if (scheduled) {
          console.log('device', device)
          const device_id = this.deviceIds[device.name] // eg 'Marumatsu' -> 1
          // check for events in previous n secs
          const start = new Date(now.getTime() - this.dbInterval * 1000)
          const stop = now
          const deviceWasActive = await this.getActive(
            device,
            path,
            start,
            stop
          )
          if (deviceWasActive) {
            await this.incrementBins(device_id, now, 'active')
          }
          await this.incrementBins(device_id, now, 'available')
        }
        //. increment calendar bins - for each device? for the whole place?
        // await this.incrementBins(device_id, now, 'calendar')
      }
    }
  }

  // backfill the active and available field bins
  async backfill() {
    //
  }

  // check if a device was 'active' (ie has events on the given path),
  // between two times. returns true/false
  async getActive(device, path, start, stop) {
    const sql = `
    select count(value) > 0 as active
    from history_all
    where
      device = '${device.name}'
      and path = '${path}'
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
      await this.db.query(sql)
    }
  }
}
