// get jobnum and jobcount from jobboss

// too complex -
// // if jobnum changes, writes jcomplete timestamp to database.
// // grafana can then count the number of jcomplete occurrences in a timerange
// // to get total jobcount.

// see also feedback.js driver, which checks jobnum changes in cache and resets partcounts.

const pollInterval = 5000 // ms - ie poll for job num change every 5 secs. keep largish to avoid db hits

export class Jobs {
  //
  // will check jobnum and jobcount for each device in devices
  async start({ cache, pool, devices }) {
    console.log('JobBoss jobs - start poll interval', pollInterval, 'ms')
    this.cache = cache
    this.pool = pool
    this.devices = devices
    this.lastJobs = {} // device.id: jobnum
    // this.deviceJobsCompleted = {} // device -> { job -> timestamp } - cache of completed jobs for each device
    // this.lastDate = null

    // await this.backfill()
    await this.poll() // do initial poll
    setInterval(this.poll.bind(this), pollInterval) // start poll timer
  }

  //

  async poll() {
    //

    // // first check if date changed - if so, reset the completed cache
    // if (this.dateChanged()) {
    //   console.log('JobBoss jobs - date changed, reset completed cache')
    //   this.completed = {}
    // }

    // iterate over all devices, check if has a jobbossId
    for (let device of this.devices) {
      const jobbossId = device.custom?.jobbossId
      if (jobbossId) {
        const job = await this.getJob(jobbossId)
        if (job === undefined) continue // skip this device

        // set cache value
        //. what if could attach some code to this cache key?
        // eg you'd have some code that would output shdr,
        // and some code that would set the jcomplete time on change.
        // note: this key corresponds to path 'processes/job/process_aggregate_id-order_number'
        this.setValue('job', job)

        // get jobcount for today
        //. should we reset this daily or keep a running total?
        // running total would be more useful - handle arbitrary time ranges
        //. uhh how do that from adapter though?
        // i guess we'd need another meter to do a life count for jobs. yeah?
        // umm, yeah we'd need to handle jobcounts DECREASING also.
        // unlike for the partcount

        // this.handleJob(device, job)
        // const jobs = await this.getJobs(jobbossId)
        // if (jobs === undefined) continue // skip this device
        // this.handleJobs(device, jobs)
      }
    }
  }

  // helper methods

  setValue(key, value) {
    // sends shdr to agent IF cache value changed
    this.cache.set(`${this.device.id}-${key}`, value)
  }

  // dateChanged() {
  //   const date = new Date()
  //   const dateStr = date.toISOString().slice(0, 10)
  //   if (this.lastDate !== dateStr) {
  //     this.lastDate = dateStr
  //     return true
  //   }
  //   return false
  // }

  async getJob(jobbossId) {
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
      // 'Job' must match case of sql
      // use NONE to indicate no job
      job = result?.recordset[0]?.Job || 'NONE'
    } catch (error) {
      console.log(`JobBoss jobs ${device.name} error`, error.message)
      console.log(`JobBoss jobs sql`, sql)
    }
    return job
  }

  // handle jobnum for this device
  handleJob(device, job) {
    // initialize last job if not set
    this.lastJobs[device.id] = this.lastJobs[device.id] ?? job

    // if job changed, and not transitioning from NONE, record time completed.
    // if a job changes TO NONE though, it will be recorded.
    //. what about UNAVAILABLE? or do we ever get that?
    //. could also query db for estqty,runqty here and update those?
    // ie Est_Required_Qty, Act_Run_Qty
    const oldJob = this.lastJobs[device.id]
    if (job !== oldJob) {
      console.log(`JobBoss jobs ${device.name} job ${oldJob} to ${job}`)
      if (oldJob !== 'NONE') {
        const now = new Date().toISOString()
        // this key corresponds to path 'processes/job/process_time-complete'
        this.cache.set(`${device.id}-jcomplete`, now)
      }
      this.lastJobs[device.id] = job // bug: had this inside the oldJob !== 'NONE' block, so didn't update
    }
  }

  //   async getJobs(jobbossId) {
  //     // get the most recently started jobs for this workcenter/device.
  //     // could also use where work_center='MARUMATSU', but not guaranteed unique.
  //     // status is C=complete, S=started?, O=ongoing?
  //     // make sure status is not complete, ie C.
  //     const sql = `
  //       select top 5
  //         Job
  //       from
  //         Job_Operation
  //       where
  //         WorkCenter_OID = '${jobbossId}'
  //         and Status <> 'C'
  //         and Actual_Start is not null
  //       order by
  //         Actual_Start desc
  //     `
  //     // pool error handler should catch any errors, but add try/catch in case not
  //     let jobs
  //     try {
  //       const result = await this.pool.query(sql)
  //       // 'Job' must match case of sql
  //       // use NONE to indicate no job
  //       jobs = result?.recordset?.map(record => record.Job) || ['NONE']
  //     } catch (error) {
  //       console.log(`JobBoss jobs ${device.name} error`, error.message)
  //       console.log(`JobBoss jobs sql`, sql)
  //     }
  //     return jobs
  //   }

  //   handleJobs(device, jobs) {
  //     const activeJob = jobs[0] // assume this is the active job, others are inactive
  //     const jobsCompleted = this.deviceJobsCompleted[device.id] ?? {}
  //     if (activeJob !== this.lastActiveJobs[device.id]) {
  //       // active job changed, so reset completed cache
  //     }

  //     // this.deviceJobsCompleted[device.id] = this.deviceJobsCompleted[device.id] ?? {}
  //     // this.deviceJobsCompleted[device.id][job] = 0
  //     // set cache value
  //     // sends shdr to agent IF cache value changed
  //     // note: this key corresponds to path 'processes/job/process_aggregate_id-order_number'
  //     //. what if could pass an optional code block here to run if cache value changed?
  //     // eg reset the part count by sending a message to the device
  //     //. or, attach some code to that cache value? ie you'd have some code that would output shdr,
  //     // and some code that would set the jcomplete time on change.
  //     this.cache.set(`${device.id}-job`, job)

  //     // initialize last job if not set
  //     this.lastJobs[device.id] = this.lastJobs[device.id] ?? job

  //     // if job changed, and not transitioning from NONE, record time completed.
  //     // if a job changes TO NONE though, it will be recorded.
  //     //. what about UNAVAILABLE? or do we ever get that?
  //     //. could also query db for estqty,runqty here and update those?
  //     // ie Est_Required_Qty, Act_Run_Qty
  //     const oldJob = this.lastJobs[device.id]
  //     if (job !== oldJob) {
  //       console.log(`JobBoss jobs ${device.name} job ${oldJob} to ${job}`)
  //       if (oldJob !== 'NONE') {
  //         const now = new Date().toISOString()
  //         // this key corresponds to path 'processes/job/process_time-complete'
  //         this.cache.set(`${device.id}-jcomplete`, now)
  //       }
  //       this.lastJobs[device.id] = job // bug: had this inside the oldJob !== 'NONE' block, so didn't update
  //     }
  //   }
}
