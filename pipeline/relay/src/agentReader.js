// agent reader
// class to read data from an agent - handles probe, current, sample loop.
// a setup can have multiple agents running that it needs to pull data from.

import { Probe } from './dataProbe.js'
import { Observations } from './dataObservations.js'
// import * as tracker from './tracker.js'
import { Feedback } from './feedback.js'
import * as lib from './lib.js'

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
    //. these will be dynamic - optimize on the fly
    this.interval = params.fetchInterval
    this.count = params.fetchCount
  }

  // start fetching and processing data
  async start() {
    // // make tracker for metric calcs
    // this.tracker = new tracker.Tracker(this.db, this.setup)
    // // start timer which dumps bins to db every interval secs
    // //.. use 5s for testing, 60s for production
    // this.tracker.startTimer(60)
    // // this.tracker.startTimer(5)

    // make feedback object to track data and feedback to devices as needed.
    // used to track jobnum change to reset marumatsu counter.
    //. this will be replaced by MTConnect Interfaces.
    this.feedback = new Feedback(this.db)
    this.feedback.start(5) // polling seconds

    // probe - get agent data structures and write to db
    probe: do {
      const probe = new Probe()
      await probe.read(this.endpoint) // read xml into probe.json, probe.elements, probe.nodes
      await probe.write(this.db) // write/sync dataitems to db, get probe.indexes
      this.instanceId = probe.instanceId
      // this.tracker.setDevices(
      //   probe.nodes.filter(node => node.node_type === 'Device')
      // )

      // current - get last known values of all dataitems and write to db
      current: do {
        const current = new Observations('current')
        await current.read(this.endpoint) // get observations and this.sequence numbers
        if (instanceIdChanged(current, probe)) break probe
        await current.write(this.db, probe.indexes) // write this.observations to db
        // this.tracker.writeObservationsToBins(current.observations) // update bins - timer will write to db
        this.from = current.sequence.next

        // sample - get sequence of dataitem values, write to db
        const sample = new Observations('sample')
        sample: do {
          await sample.read(this.endpoint, this.from, this.count) // get observations
          if (instanceIdChanged(sample, probe)) break probe
          await sample.write(this.db, probe.indexes) // write this.observations to db
          // this.tracker.writeObservationsToBins(sample.observations) // update bins - timer will write to db
          this.from = sample.sequence.next //. ?
          await lib.sleep(this.interval)
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
