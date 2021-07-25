// agent reader
// class to read data from an agent - handles probe, current, sample loop.
// a setup can have multiple agents running that it needs to pull data from.

import { Probe } from './dataProbe.js'
import { Current } from './dataCurrent.js'
import { Sample } from './dataSample.js'
import * as libapp from './libapp.js'

export class AgentReader {
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

  // // init agent reader
  // async init() {
  //   //. read probe info incl device info, instanceId
  //   //. read dataitems.yaml to translate shdr id to canonical id?
  //   //. or do that with a path-to-canonicalId translator?
  //   const probe = new Probe()
  //   await probe.read(this.endpoint)
  //   await probe.write(this.db)
  //   this.instanceId = probe.instanceId
  // }

  // start fetching and processing data
  async start() {
    // probe - get agent data structures and write to db
    probe: do {
      const probe = new Probe()
      await probe.read(this.endpoint) // read xml into probe.json
      await probe.write(this.db) // write/sync dataitems to db, write to probe.indexes
      this.instanceId = probe.instanceId

      // current - get last known values of all dataitems, write to db
      current: do {
        // const current = new Observations() ?
        const current = new Current()
        await current.read(this.endpoint)
        if (instanceIdChanged(current, probe)) break probe
        await current.write(this.db)

        // sample - get sequence of dataitem values, write to db
        sample: do {
          const sample = new Sample()
          await sample.read(this.endpoint, this.from, this.count)
          if (instanceIdChanged(sample, probe)) break probe
          await sample.write(this.db)
          console.log('.')
          await libapp.sleep(this.interval)
        } while (true)
      } while (true)
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
