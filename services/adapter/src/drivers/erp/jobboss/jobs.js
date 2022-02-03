// check jobnum from jobboss db

// import fs from 'fs' // node lib for filesys

const pollInterval = 5000 // ms - ie poll for job num every 5 secs

// const cookiePath = '/data/adapter/cookies/jobboss/jobs.json'

export class Jobs {
  // will check jobnum for each device in devices
  async start({ cache, pool, devices }) {
    this.cache = cache
    this.pool = pool
    this.devices = devices

    // await this.backfill()
    await this.poll() // do initial poll
    setInterval(this.poll.bind(this), pollInterval) // start poll timer
  }

  // backfilling jobnum from adapter won't work, as we'd lose the starttimes
  // unless....
  // could do so with cache.set(dataitem, value, __datetime__)?
  // ie specify the datetime in the shdr, which normally is just the current datetime.
  // that info is included by the agent current/sample values, eg
  // <Job dataItemId="j-job" name="job" sequence="19" timestamp="2022-01-20T08:31:22.222968Z">UNAVAILABLE</Job>
  // so relay could pick that up and write the jobnum with the appropriate timestamp.

  // so try that, though do last of the backfill operations as less important

  // async backfill() {
  //   console.log(`JobBoss - backfill job info...`)
  //   // how do we know how much to backfill?
  //   // need a little cookie to store where we left off, if anywhere,
  //   // can set it manually to some start date, eg 2021-11-01
  //   const json = fs.readFileSync(cookiePath)
  //   console.log(json)
  // }

  async poll() {
    console.log(`JobBoss - polling for job info...`)

    // simple test - works
    // this.cache.set(`${deviceId}-job`, Math.floor(Math.random() * 1000))

    // iterate over all devices, check if has a jobboss ID //. call it workcenterId?
    for (let device of this.devices) {
      if (device.jobbossId) {
        // get the most recently started job for this workcenter/device.
        // can also use where work_center='MARUMATSU', but not guaranteed unique.
        //. check status for completion? (S=started, C=complete?)
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
        const result = await this.pool.query(sql)
        const job = result.recordset.length > 0 && result.recordset[0].job
        this.cache.set(`${device.id}-job`, job)
      }
    }
  }
}
