// agent
// class to represent an agent - handles probe, current, sample loop

import { Probe } from './dataProbe.js'
// import { Current } from './dataCurrent.js'
// import { Sample } from './dataSample.js'
// import * as libapp from './libapp.js'

export class Agent {
  // db is a Db instance
  // endpoint is an Endpoint instance
  // params includes { }
  constructor({ db, endpoint, params }) {
    this.db = db
    this.endpoint = endpoint
    this.params = params
    //
    this.instanceId = null
    //
    this.from = null
    //. these will be dynamic - optimize on the fly
    this.interval = params.fetchInterval
    this.count = params.fetchCount
  }

  // init agent
  async init() {
    //. read probe info incl device info, instanceId
    //. read dataitems.yaml to translate shdr id to canonical id?
    //. or do that with a path-to-canonicalId translator?
    const probe = new Probe()
    await probe.read(this.endpoint)
    await probe.write(this.db)
    this.instanceId = probe.instanceId
  }

  // start fetching and processing data
  async start() {
    // probe - get agent data structures and write to db
    probe: do {
      const probe = new Probe()
      await probe.read(this.endpoint)
      // need guard in case coming after init - don't do twice
      if (instanceIdChanged(probe, this)) {
        await probe.write(this.db)
        this.instanceId = probe.instanceId
      }

      process.exit(0)

      // // current - get last known values of all dataitems, write to db
      // current: do {
      //   const current = await Data.getCurrentData(this.endpoint)
      //   if (instanceIdChanged(current, probe)) break probe
      //   await this.handleCurrentData(current) // update db

      //   // sample - get sequence of dataitem values, write to db
      //   sample: do {
      //     // // const sample = await this.fetchSample()
      //     // const sample = await Data.getSampleData(this.endpoint, from, count)
      //     // if (instanceIdChanged(sample, probe)) break probe
      //     // await this.handleSampleData(sample)
      //     // console.log('.')
      //     // await libapp.sleep(this.fetchInterval)
      //   } while (true)
      // } while (true)
    } while (true)
  }
}

//

function instanceIdChanged(data1, data2) {
  if (data1.instanceId !== data2.instanceId) {
    console.log(`InstanceId changed - falling back to probe...`)
    return true
  }
  return false
}
