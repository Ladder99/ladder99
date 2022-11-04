// agent reader
// class to read data from an agent - handles probe, current, sample loop.
// a setup can have multiple agents running that it needs to pull data from.

import { Probe } from './dataProbe.js'
import { Observations } from './dataObservations.js'
// import { Feedback } from './feedback.js'
import * as lib from './common/lib.js'

export class AgentReader {
  //
  // db is a Db instance - db.js
  // endpoint is an Endpoint instance - endpoint.js - to poll agent
  // params includes { fetchInterval, fetchCount }
  // setup is client's setup.yaml
  // called by relay.js
  constructor({ db, endpoint, params, setup }) {
    this.db = db
    this.endpoint = endpoint
    this.params = params
    this.setup = setup

    this.instanceId = null

    this.from = null
    // these are dynamic - optimized on the fly
    //. or use streaming instead of polling
    this.interval = params.fetchInterval
    this.count = params.fetchCount
  }

  // start fetching and processing data
  async start() {
    // // make feedback object to track data and feedback to devices as needed.
    // // used to track jobnum change to reset marumatsu counter.
    // //. this will be replaced by MTConnect Interfaces.
    // this.feedback = new Feedback(this.setup)
    // this.feedback.start() // get mqtt connection, start check timer

    // probe - get agent data structures and write to db
    probe: do {
      // we pass this.setup also so probe can use translations for dataitem paths
      const probe = new Probe(this.setup) // see dataProbe.js
      await probe.read(this.endpoint) // read xml into probe.json, probe.elements, probe.nodes
      await probe.write(this.db) // write/sync dataitems to db, get probe.indexes
      this.instanceId = probe.instanceId

      // current - get last known values of all dataitems and write to db
      current: do {
        const current = new Observations('current')
        await current.read(this.endpoint) // get observations and this.sequence numbers
        if (instanceIdChanged(current, probe)) break probe
        await current.write(this.db, probe.indexes) // write this.observations to db
        // await this.feedback.set(current) // set current monitored values
        this.from = current.sequence.next
        // make sure our count value is not over the agent buffer size,
        // else next sample read would get an error.
        if (this.count > current.sequence.size) {
          this.count = current.sequence.size
        }

        // sample - get sequence of dataitem values, write to db
        const sample = new Observations('sample')
        sample: do {
          // get observations
          const status = await sample.read(this.endpoint, this.from, this.count)
          // if (!(await sample.read(this.endpoint, this.from, this.count))) {
          //   // handle out of range error during read by increasing throughput
          //   this.count += 100 // the number of observations to read next time
          //   // this.interval -= 100
          //   console.log(
          //     `Got error during read - increasing throughput: count=${this.count}.`
          //   )
          //   break current
          // }
          if (instanceIdChanged(sample, probe)) break probe
          if (!status) {
            // handle out of range error during read by increasing throughput
            this.count += 100 // the number of observations to read next time
            // this.interval -= 100
            console.log(
              `Got error during read - increasing throughput: count=${this.count}.`
            )
            break current
          }
          await sample.write(this.db, probe.indexes) // write this.observations to db
          // await this.feedback.check(sample) // check for changes, write feedback to devices
          this.from = sample.sequence.next // make sure our 'from' value is ok
          // too many observations might come in during this interval,
          // so next read could get an xml error message.
          // so need dynamic from, count, and interval.
          // if get error, decrease this.interval and/or increase this.count and bump back to 'current' loop.
          await lib.sleep(this.interval)
        } while (true)
      } while (true)
    } while (true)
  }
}

//

function instanceIdChanged(data1, data2) {
  if (data1.instanceId !== data2.instanceId) {
    console.log(`Relay - instanceId changed - falling back to probe...`)
    return true
  }
  return false
}
