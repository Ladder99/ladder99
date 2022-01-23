const pollInterval = 5000 // ms - ie poll for job num every 5 secs

export class Jobs {
  // start polling
  // will check jobnum for each device in devices
  async start({ cache, pool, devices }) {
    this.cache = cache
    this.pool = pool
    this.devices = devices

    // await this.backfillJob()
    await this.poll() // do initial poll
    setInterval(this.poll.bind(this), pollInterval) // start poll timer
  }

  // poll for job info
  async poll() {
    console.log(`JobBoss - polling for job info...`)

    // simple test - works
    // this.cache.set(`${deviceId}-job`, Math.floor(Math.random() * 1000))

    // iterate over all devices, check if has a jobboss ID //. call it workcenterId?
    for (let device of this.devices) {
      if (device.jobbossId) {
        // get the most recently started job for this workcenter/device.
        // can also use where work_center='MARUMATSU', but not guaranteed unique.
        const sql = `
          select top 1
            job
          from
            job_operation
          where
            workcenter_oid = '${device.jobbossId}'
          order by
            actual_start desc
        `
        console.log(sql)
        const result = await this.pool.query(sql)
        console.log(`JobBoss result`, result)
        const job = result.recordset.length > 0 && result.recordset[0].job
        this.cache.set(`${device.id}-job`, job)
      }
    }
  }
}
