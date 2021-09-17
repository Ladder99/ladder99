// agent reader
// class to read data from an agent - handles probe, current, sample loop.
// a setup can have multiple agents running that it needs to pull data from.

import { Probe } from './dataProbe.js'
import { Observations } from './dataObservations.js'
import * as libapp from './libapp.js'

export class AgentReader {
  // db is a Db instance
  // endpoint is an Endpoint instance
  // params includes { fetchInterval, fetchCount }
  // called by relay.js
  constructor({ db, endpoint, params }) {
    this.db = db
    this.endpoint = endpoint
    this.params = params

    this.instanceId = null

    this.from = null
    //. these will be dynamic - optimize on the fly
    this.interval = params.fetchInterval
    this.count = params.fetchCount

    this.currentDimensions = {} // eg incl operator:'Alice'
    this.startTimes = {} // eg availability: '2021-09-17T05:27:00Z'
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
      await probe.write(this.db) // write/sync dataitems to db, get probe.indexes
      this.instanceId = probe.instanceId

      // current - get last known values of all dataitems and write to db
      current: do {
        const current = new Observations('current')
        await current.read(this.endpoint) // get observations and this.sequence numbers
        if (instanceIdChanged(current, probe)) break probe
        await current.write(this.db, probe.indexes)
        await current.calculate(
          this.db,
          probe.indexes,
          this.currentDimensions,
          this.startTimes
        )
        this.from = current.sequence.next

        // sample - get sequence of dataitem values, write to db
        const sample = new Observations('sample')
        sample: do {
          await sample.read(this.endpoint, this.from, this.count) // get observations
          if (instanceIdChanged(sample, probe)) break probe
          await sample.write(this.db, probe.indexes)
          await sample.calculate(
            this.db,
            probe.indexes,
            this.currentDimensions,
            this.startTimes
          )
          this.from = sample.sequence.next //. ?
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
