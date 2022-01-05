// agent reader
// class to read data from an agent - handles probe, current, sample loop.
// a setup can have multiple agents running that it needs to pull data from.

import { Probe } from './dataProbe.js'
import { Observations } from './dataObservations.js'
import * as tracker from './tracker/tracker.js'
import * as lib from './lib.js'

// // dimensionDefs
// // if any one of these dimensions changes,
// // start putting the time / count values in other bins.
// // keyed on dataitem name, eg 'operator'.
// //. move these into yaml, and have per client
// //. might want these to be per device or device type also?
// const dimensionDefs = {
//   hours1970: {},
//   // add these as needed, to be able to slice reports later
//   operator: {},
//   // machine: {},
//   // component: {},
//   // job: {},
//   // operation: {},
// }

// // valueDefs
// // dataitems that we want to track the state of.
// // will track time the dataitem spends in the 'when' state,
// // and add it to the given 'slot'.
// // keyed on dataitem / observation NAME, NOT the dataitem id.
// // so in the agent.xml, DO NOT include the deviceId in the names,
// // just have a plain descriptor.
// //. move these into yaml, and have per client
// //. might want these to be per device or device type also
// const valueDefs = {
//   availability: {
//     when: 'AVAILABLE',
//     slot: 'time_available',
//   },
//   // execution_state: {
//   //   when: 'ACTIVE',
//   //   slot: 'time_active',
//   // },
//   functional_mode: {
//     when: 'PRODUCTION',
//     // slot: 'time_production',
//     slot: 'time_active', //. this is kinda klugy - reuse the time_active definition because the metrics view is setup to use that to calculate uptime
//   },
// }

//

export class AgentReader {
  //
  // db is a Db instance
  // endpoint is an Endpoint instance to poll agent
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
  }

  // start fetching and processing data
  async start() {
    // for metric calcs
    this.tracker = new tracker.Tracker(this.db) //, dimensionDefs, valueDefs)
    // this.tracker.startTimer(60) // start timer which dumps bins to db every interval secs
    this.tracker.startTimer(5) //.. start timer which dumps bins to db every interval secs

    // probe - get agent data structures and write to db
    probe: do {
      const probe = new Probe()
      await probe.read(this.endpoint) // read xml into probe.json, probe.elements, probe.nodes
      await probe.write(this.db) // write/sync dataitems to db, get probe.indexes
      this.instanceId = probe.instanceId
      this.tracker.setDevices(
        probe.nodes.filter(node => node.node_type === 'Device')
      )

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
