// const jobCompleteKey = 'jcomplete' // cache key for job complete time - corresponds to 'processes/job/process_time-complete'

// this.deviceJobsCompleted = {} // { device.id: { jobnum: timestamp } } - cache of completed jobs for each device
// this.lastDate = null // keep track of date so can tell if crossed midnight

// // first check if date changed - if so, reset the completed cache for all devices
// //. is this right?
// if (this.dateChanged()) {
//   console.log('JobBoss jobs - date changed, reset completed cache')
//   this.deviceJobsCompleted = {}
// }

// dateChanged() {
//   const date = new Date()
//   const dateStr = date.toISOString().slice(0, 10)
//   if (this.lastDate !== dateStr) {
//     this.lastDate = dateStr
//     return true
//   }
//   return false
// }

// // get list of most recently started jobs for this workcenter/device from jobboss db.
// // eg ['123','456','789']
// async getJobs(jobbossId) {
//   // could also use where work_center='MARUMATSU', but not guaranteed unique.
//   // status is O=open, S=started, C=complete
//   // make sure status is <> 'C'.
//   // inside_oper is 1 if inside operation, 0 if not.
//   const sql = `
//       select top 5
//         Job
//       from
//         Job_Operation
//       where
//         WorkCenter_OID = '${jobbossId}'
//         -- Work_Center = 'MARUMATSU'
//         and Status <> 'C'
//         and Actual_Start is not null
//         and Inside_Oper = 1
//       order by
//         Actual_Start desc
//     `
//   // pool error handler should catch any errors, but add try/catch in case not
//   let jobs
//   try {
//     const result = await this.pool.query(sql) // query jobboss db
//     jobs = result?.recordset?.map(record => record.Job) || [] // '.Job' must match case of sql
//   } catch (error) {
//     console.log(`JobBoss jobs ${device.name} error`, error.message)
//     console.log(`JobBoss jobs sql`, sql)
//     jobs = null // signal error
//   }
//   return jobs
// }

// // handle jobs for a single device
// handleJobs(device, jobs) {
//   if (!jobs) return // skip if db or other error. note: an empty array is still truthy.

//   // get active job
//   // assume jobs[0] is the active job, others are inactive.
//   // if list is empty, use string 'NONE'.
//   const activeJob = jobs[0] ?? noneJob

//   // get cache of completed jobs for each device - ie dict of { job: timestamp }
//   const jobsCompleted = this.deviceJobsCompleted[device.id] ?? {}

//   // set cache value
//   // sends shdr to agent IF cache value changed
//   this.cache.set(`${device.id}-${jobKey}`, activeJob)

//   // initialize last job if not set
//   this.deviceLastActiveJob[device.id] =
//     this.deviceLastActiveJob[device.id] ?? activeJob

//   // if active job changed, and not transitioning from NONE, record time completed.
//   // if a job changes TO NONE though, it will be recorded.
//   //. what about UNAVAILABLE? or do we ever get that?
//   //. could also get estqty, runqty here and update those? ie Est_Required_Qty, Act_Run_Qty
//   const lastActiveJob = this.deviceLastActiveJob[device.id] // eg '123'
//   if (activeJob !== lastActiveJob) {
//     console.log(
//       `JobBoss jobs ${device.name} job ${lastActiveJob}->${activeJob}`
//     )
//     if (lastActiveJob !== noneJob) {
//       const now = new Date().toISOString()
//       this.cache.set(`${device.id}-${jobCompleteKey}`, now)
//     }
//     this.deviceLastActiveJob[device.id] = activeJob // bug: had this inside the inner if block
//   }
// }

// const job = await this.getJob(jobbossId)
// if (job === undefined) continue // skip this device

// // set cache value
// //. what if could attach some code to this cache key?
// // eg you'd have some code that would output shdr,
// // and some code that would set the jcomplete time on change.
// // note: this key corresponds to path 'processes/job/process_aggregate_id-order_number'
// this.setValue('job', job)

// get jobcount for today
//. should we reset this daily or keep a running total?
// running total would be more useful - handle arbitrary time ranges
//. uhh how do that from adapter though?
// i guess we'd need another meter to do a life count for jobs. yeah?
// umm, yeah we'd need to handle jobcounts DECREASING also.
// unlike for the partcount. except ignore them on datechange.

// this.handleJob(device, job)

//

//. what if could pass an optional code block here to run if cache value changed?
// eg reset the part count by sending a message to the device
//. or, attach some code to that cache value? ie you'd have some code that would output shdr,
// and some code that would set the jcomplete time on change.
// this.cache.set(`${device.id}-${jobKey}`, activeJob)

// jobboss db error codes
// const errorMessages = {
//   ELOGIN: 'Login failed (locked out)',
//   ETIMEOUT: 'Connection timeout',
//   EALREADYCONNECTED: 'Database is already connected',
//   EALREADYCONNECTING: 'Already connecting to database',
//   EINSTLOOKUP: 'Instance lookup failed',
//   ESOCKET: 'Socket error (could not connect to db url)',
// }

// // get list of most recently started jobs for this workcenter/device,
// // and handle them. can be null.
// const jobs = await this.getJobs(jobbossId)
// this.handleJobs(device, jobs)

// // handle jobnum for this device
// handleJob(device, job) {
//   //
//   // // initialize last job if not set
//   // this.lastActiveJob[device.id] = this.lastActiveJob[device.id] ?? job
//   // // if job changed, and not transitioning from NONE, record time completed.
//   // // if a job changes TO NONE though, it will be recorded.
//   // //. what about UNAVAILABLE? or do we ever get that?
//   // //. could also query db for estqty,runqty here and update those?
//   // //. handle job start similarly - transition from O or nothing to S
//   // // ie Est_Required_Qty, Act_Run_Qty
//   // const oldJob = this.lastActiveJob[device.id]
//   // if (job !== oldJob) {
//   //   console.log(`JobBoss jobs ${device.name} job ${oldJob} to ${job}`)
//   //   if (oldJob !== NONE) {
//   //     const now = new Date().toISOString()
//   //     // this key corresponds to path 'processes/job/process_time-complete'
//   //     this.cache.set(`${device.id}-jcomplete`, now)
//   //   }
//   //   this.lastActiveJob[device.id] = job // bug: had this inside the oldJob !== NONE block, so didn't update
//   // }
// }

// helper methods

// // send shdr to agent IF cache value changed
// setValue(key, value) {
//   this.cache.set(`${this.device.id}-${key}`, value)
// }
