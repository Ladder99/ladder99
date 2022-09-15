// get jobnum from jobboss

const pollInterval = 5000 // ms - ie poll for job num change every 5 secs

export class Jobs {
  //
  // will check jobnum for each device in devices
  async start({ cache, pool, devices }) {
    console.log('JobBoss jobs - start poll interval', pollInterval, 'ms')
    this.cache = cache
    this.pool = pool
    this.devices = devices

    // await this.backfill()
    await this.poll() // do initial poll
    setInterval(this.poll.bind(this), pollInterval) // start poll timer
  }

  async poll() {
    //
    // iterate over all devices, check if has a jobbossId
    for (let device of this.devices) {
      if (device.jobbossId) {
        // get the most recently started job for this workcenter/device.
        // could also use where work_center='MARUMATSU', but not guaranteed unique.
        //. check status for completion? (S=started, C=complete?)
        // "select top 1 Job from Job_Operation where WorkCenter_OID=foofoo order by Actual_Start desc"
        const sql = `
          select top 1
            Job --, Est_Required_Qty, Act_Run_Qty
          from
            Job_Operation
          where
            WorkCenter_OID = '${device.jobbossId}'
          order by
            Actual_Start desc
        `
        // pool error handler should catch any errors, but add try/catch in case not
        try {
          const result = await this.pool.query(sql)
          const job = result.recordset.length > 0 && result.recordset[0].Job // must match case of sql
          // console.log('device', device.name, 'job', job)
          this.cache.set(`${device.id}-job`, job) // will send shdr to agent IF cache value changed

          //. if job changed, could query db for estqty,runqty also, set the cache values
          //
        } catch (error) {
          console.log(`JobBoss jobs ${device.name} error`, error)
        }
      }
    }
  }
}
