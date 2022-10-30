// get jobnum and jobcount from jobboss

// see also feedback.js driver, which checks jobnum changes in cache and resets partcounts.

//. make a params object
const pollInterval = 5000 // ms - ie poll for job num change every 5 secs. keep largish to reduce db hits
const noneJob = 'NONE' // jobnum for no job
const jobKey = 'job' // cache key for jobnum - corresponds to path 'processes/job/process_aggregate_id-order_number'
const jobCompleteKey = 'jcomplete' // cache key for job complete time - corresponds to 'processes/job/process_time-complete'

export class Jobs {
  //
  // will check jobnum and jobcount for each device in devices
  async start({ cache, pool, devices }) {
    console.log('JobBoss jobs - start poll interval', pollInterval, 'ms')
    this.cache = cache
    this.pool = pool
    this.devices = devices
    this.lastJobs = {} // device.id: jobnum
    this.deviceJobsCompleted = {} // { device: { job: timestamp } } - cache of completed jobs for each device
    this.lastDate = null

    // await this.backfill()
    await this.poll() // do initial poll
    setInterval(this.poll.bind(this), pollInterval) // start poll timer
  }

  //

  async poll() {
    //

    // first check if date changed - if so, reset the completed cache
    if (this.dateChanged()) {
      console.log('JobBoss jobs - date changed, reset completed cache')
      this.completed = {}
    }

    // iterate over all devices, check if has a jobbossId
    for (let device of this.devices) {
      const jobbossId = device.custom?.jobbossId // eg '8EE4B90E-7224-4A71-BE5E-C6A713AECF59'
      if (jobbossId) {
        // get list of most recently started jobs for this workcenter/device.
        const jobs = await this.getJobs(jobbossId)
        if (!jobs) continue // db or other error - skip this device. note: an empty array is still truthy.

        // handle jobs
        this.handleJobs(device, jobs)
      }
    }
  }

  // get list of most recently started jobs for this workcenter/device from jobboss db.
  // eg ['123','456','789']
  async getJobs(jobbossId) {
    // could also use where work_center='MARUMATSU', but not guaranteed unique.
    // status is C=complete, S=started?, O=ongoing?
    // make sure status is not complete, ie <>'C'.
    // order by start date desc, so most recent is first.
    // inside_oper is 1 if inside operation, 0 if not.
    const sql = `
        select top 5
          Job
        from
          Job_Operation
        where
          WorkCenter_OID = '${jobbossId}'
          and Status <> 'C'
          and Actual_Start is not null
          and Inside_Oper = 1
        order by
          Actual_Start desc
      `
    // pool error handler should catch any errors, but add try/catch in case not
    let jobs
    try {
      const result = await this.pool.query(sql) // query jobboss db
      jobs = result?.recordset?.map(record => record.Job) || [] // '.Job' must match case of sql
    } catch (error) {
      console.log(`JobBoss jobs ${device.name} error`, error.message)
      console.log(`JobBoss jobs sql`, sql)
      jobs = null // signal error
    }
    return jobs
  }

  // handle jobs for a single device
  handleJobs(device, jobs) {
    //
    // get active job
    // assume jobs[0] is the active job, others are inactive.
    // if list is empty, use string 'NONE'.
    const activeJob = jobs[0] ?? noneJob

    // get cache of completed jobs for each device
    // ie dict of { job: timestamp }
    const jobsCompleted = this.deviceJobsCompleted[device.id] ?? {}

    // if active job changed
    const lastActiveJob = this.lastActiveJobs[device.id]
    if (activeJob !== lastActiveJob) {
    }

    // set cache value
    // sends shdr to agent IF cache value changed
    //. what if could pass an optional code block here to run if cache value changed?
    // eg reset the part count by sending a message to the device
    //. or, attach some code to that cache value? ie you'd have some code that would output shdr,
    // and some code that would set the jcomplete time on change.
    this.cache.set(`${device.id}-${jobKey}`, activeJob)

    // initialize last job if not set
    this.lastJobs[device.id] = this.lastJobs[device.id] ?? activeJob

    // if job changed, and not transitioning from NONE, record time completed.
    // if a job changes TO NONE though, it will be recorded.
    //. what about UNAVAILABLE? or do we ever get that?
    //. could also query db for estqty,runqty here and update those?
    // ie Est_Required_Qty, Act_Run_Qty
    const oldJob = this.lastJobs[device.id]
    if (activeJob !== oldJob) {
      console.log(`JobBoss jobs ${device.name} job ${oldJob} to ${activeJob}`)
      if (oldJob !== noneJob) {
        const now = new Date().toISOString()
        this.cache.set(`${device.id}-${jobCompleteKey}`, now)
      }
      this.lastJobs[device.id] = activeJob // bug: had this inside the oldJob !== 'NONE' block, so didn't update
    }
  }

  // helper methods

  setValue(key, value) {
    // sends shdr to agent IF cache value changed
    this.cache.set(`${this.device.id}-${key}`, value)
  }

  dateChanged() {
    const date = new Date()
    const dateStr = date.toISOString().slice(0, 10)
    if (this.lastDate !== dateStr) {
      this.lastDate = dateStr
      return true
    }
    return false
  }
}
