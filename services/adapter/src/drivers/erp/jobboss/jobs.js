// get jobnum from jobboss

// if jobnum changes, writes jcomplete timestamp to database.
// grafana can then count the number of jcomplete occurrences in a timerange
// to get total jobcount.

// see also feedback.js driver, which checks jobnum changes and resets partcounts.

const pollInterval = 5000 // ms - ie poll for job num change every 5 secs

export class Jobs {
  //
  // will check jobnum for each device in devices
  async start({ cache, pool, devices }) {
    console.log('JobBoss jobs - start poll interval', pollInterval, 'ms')
    this.cache = cache
    this.pool = pool
    this.devices = devices
    this.lastJobs = {}

    // await this.backfill()
    await this.poll() // do initial poll
    setInterval(this.poll.bind(this), pollInterval) // start poll timer
  }

  //

  async poll() {
    //
    // iterate over all devices, check if has a jobbossId
    for (let device of this.devices) {
      const jobbossId = device.custom?.jobbossId
      if (jobbossId) {
        // get the most recently started job for this workcenter/device.
        // could also use where work_center='MARUMATSU', but not guaranteed unique.
        // status is C=complete, S=started?, O=ongoing?
        // make sure status is not complete, ie C.
        const sql = `
          select top 1
            Job --, Est_Required_Qty, Act_Run_Qty
          from
            Job_Operation
          where
            WorkCenter_OID = '${jobbossId}'
            and Status <> 'C'
            and Actual_Start is not null
          order by
            Actual_Start desc
        `
        // pool error handler should catch any errors, but add try/catch in case not
        let job
        try {
          const result = await this.pool.query(sql)
          // 'Job' must match case of sql. use NONE to indicate no job
          job = result?.recordset[0]?.Job || 'NONE'
        } catch (error) {
          console.log(`JobBoss jobs ${device.name} error`, error.message)
        }

        // send shdr to agent IF cache value changed
        // note: this key corresponds to path 'processes/job/process_aggregate_id-order_number'
        //. what if could pass an optional code block here to run if cache value changed?
        // eg reset the part count by sending a message to the device
        this.cache.set(`${device.id}-job`, job)

        // initialize last job if not set
        this.lastJobs[device.id] = this.lastJobs[device.id] ?? job

        // if job changed, record time completed
        //. could also query db for estqty,runqty here?
        const oldJob = this.lastJobs[device.id]
        if (job !== oldJob && oldJob !== 'NONE') {
          console.log(`JobBoss jobs ${device.name} - new job`, job)
          const now = new Date().toISOString()
          // this key corresponds to path 'processes/job/process_time-complete'
          this.cache.set(`${device.id}-jcomplete`, now)
        }
        this.lastJobs[device.id] = job // bug: had this inside the if block, so was never set
      }
    }
  }
}
