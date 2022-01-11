// Track events every n seconds and increment bins as needed.

//. what if had one tracker per device? might need that.

//. pass in through constructor, with devices and metrics to track.
//. which should come from a client yaml file. metrics.yaml?
const path = 'controller/partOccurrence/part_count-all'

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

  // query db for start and stop dataitems for given device.
  // just need the regular device name as defined in setup and
  // used in postgres, eg 'Marumatsu'.
  async getSchedule(device) {
    const start = await this.db.getLatestValue(
      'history_text',
      device,
      'processes/process_time-start'
    )
    const stop = await this.db.getLatestValue(
      'history_text',
      device,
      'processes/process_time-stop'
    )
    const schedule = { start, stop }
    console.log('schedule', schedule)
    return schedule
  }

  // update bins - called by timer
  async updateBins() {
    console.log('updateBins', new Date())
    const now = new Date()
    // iterate over devices
    for (let device of this.setup.devices) {
      // we only want to track devices with a metrics object
      if (device.metrics) {
        // get schedule for this device
        const schedule = await this.getSchedule(device)
        // check if now is within scheduled time
        const scheduled = now >= schedule.start && now <= schedule.stop
        if (scheduled) {
          console.log('device', device)
          const deviceName = device.name // eg 'Marumatsu'
          const device_id = this.deviceIds[deviceName] // eg 1
          // check for events in previous n secs
          const stop = now
          const start = new Date(stop.getTime() - this.dbInterval * 1000)
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

  // check if a device was 'active' (ie has events on the given path),
  // between two times. returns true/false
  //. move sql into here
  // select
  //   count(value) > 0 as active
  // from
  //   history_all
  // where
  //   device = p_device
  //   and path = p_path
  //   and time between p_start and p_stop
  // limit 1;
  async getActive(device, path, start, stop) {
    const sql = `select get_active('${
      device.name
    }', '${path}', '${start.toISOString()}', '${stop.toISOString()}');`
    console.log(sql)
    const result = await this.db.query(sql)
    const deviceWasActive = result.rows[0].get_active // t/f
    return deviceWasActive
  }

  // increment values in the bins table.
  // will round the given time down to nearest min, hour, day, week etc,
  // and increment the given field for each.
  //. move plpgsql code into here - easier to maintain
  //   declare
  //   v_resolutions text[] := '{minute,hour,day,week,month,year}'; -- array literal
  //   v_resolution text;
  //   v_time timestamptz;
  //   v_field text := quote_ident(p_field); -- eg 'active', 'available'
  // begin
  //   foreach v_resolution in array v_resolutions loop
  //     v_time := date_trunc(v_resolution, p_time); -- round down to start of current min, hour, day, etc
  //     -- upsert/increment the given field by delta
  //     --. use $ not % for all params?
  //     execute format(
  //       'insert into bins (device_id, resolution, time, %s)
  //         values ($1, $2, $3, $4)
  //       on conflict (device_id, resolution, time) do
  //         update set %s = coalesce(bins.%s, 0) + $5;',
  //       v_field, v_field, v_field
  //     ) using p_device_id, ('1 '||v_resolution)::interval, v_time, p_delta, p_delta;
  //   end loop;
  async incrementBins(device_id, time, field) {
    const sql = `call increment_bins(${device_id}, '${time.toISOString()}', '${field}');`
    console.log(sql)
    await this.db.query(sql)
  }
}
