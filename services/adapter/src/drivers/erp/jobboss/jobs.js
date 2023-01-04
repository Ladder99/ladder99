// get jobnum from jobboss for each device

// see also feedback.js driver, which checks for jobnum changes in cache
// and resets partcounts via mqtt commands.

//. make a params object
const pollInterval = 5000 // ms - ie poll for job num change every 5 secs. keep largish to reduce db hits
const NONE = 'NONE' // jobnum for no job
const jobKey = 'job' // cache key for jobnum - corresponds to path 'processes/job/process_aggregate_id-order_number'

export class Jobs {
  //
  // start driver
  async start({ cache, pool, devices }) {
    console.log('JobBoss jobs - start poll interval', pollInterval, 'ms')
    this.cache = cache
    this.pool = pool // the jobboss db connection
    this.devices = devices // devices from setup.yaml
    this.lastActiveJob = {} // { [device.id]: jobnum }

    await this.poll() // do initial poll
    setInterval(this.poll.bind(this), pollInterval) // start poll timer
  }

  // get jobnum for each device in devices
  async poll() {
    // iterate over all devices - if has a jobbossId then get most recent job and handle it
    for (let device of this.devices) {
      const jobbossId = device.custom?.jobbossId // eg '8EE4B90E-7224-4A71-BE5E-C6A713AECF59'
      if (jobbossId) {
        const job = await this.getJob(jobbossId) // jobnum or 'NONE' (or undefined if error)
        if (job) {
          this.cache.set(`${device.id}-${jobKey}`, job) // write to cache - will output shdr IF job changed
        }
      }
    }
  }

  // get the most recently started job for this workcenter/device.
  // returns 'NONE' if no job is active.
  async getJob(jobbossId) {
    // get jobboss query
    // could also use where work_center='MARUMATSU', but not guaranteed unique.
    // status is O=open, S=started, C=complete
    // make sure status is S=started
    // we ASSUME there is only one job started per workcenter at a time.
    // inside_oper is 1 if inside operation, 0 if not.
    const sql = `
      select
        Job
      from
        Job_Operation
      where
        -- Work_Center = 'MARUMATSU'
        WorkCenter_OID = '${jobbossId}'
        and Status = 'S'
        and Actual_Start is not null
        and Inside_Oper = 1
      `
    // pool error handler should catch any errors, but add try/catch in case not
    let job
    try {
      const result = await this.pool.query(sql)
      // 'Job' must match case of sql
      // use 'NONE' to indicate no job
      job = result?.recordset[0]?.Job || NONE
    } catch (error) {
      console.log(`JobBoss jobs error`, error.message)
      console.log(`JobBoss jobs sql`, sql)
      // job = NONE // don't do this - leave job as undefined in case of error (mostly timeout errors),
      // so we don't overwrite the cache with 'NONE' and lose the previous jobnum.
    }
    return job
  }
}
