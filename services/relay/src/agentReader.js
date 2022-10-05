// agent reader
// class to read data from an agent - handles probe, current, sample loop.
// a setup can have multiple agents running that it needs to pull data from.

import { Probe } from './dataProbe.js'
import { Observations } from './dataObservations.js'
import * as lib from './common/lib.js'

const increaseCount = 100

export class AgentReader {
  //
  // params includes { fetchInterval, fetchCount }
  // db is a Db instance - see common/db.js
  // endpoint is an Endpoint instance - see endpoint.js - polls agent
  // setup is client's setup.yaml
  // agent is a single agent from setup.yaml
  // called by index.js
  constructor({ params, db, endpoint, setup, agent }) {
    this.params = params
    this.db = db
    this.endpoint = endpoint
    this.setup = setup
    this.agent = agent
    this.instanceId = null // as reported by agent

    // fetch sequence parameters
    this.from = null
    // these are dynamic - optimized on the fly for each agent.
    //. later will use streaming instead of polling
    this.interval = params.fetchInterval
    this.count = params.fetchCount
  }

  // start fetching and processing data
  async start() {
    //
    // don't read this agent if 'ignore' flag is set in setup.yaml
    if (this.agent.ignore) {
      console.log(`Relay ignore agent per setup.yaml`, this.agent.alias)
      return
    }

    // probe - get agent data structures and write to db
    probe: do {
      console.log(`Relay starting probe loop`)
      // we pass this.setup also so probe can use translations for dataitem paths
      const probe = new Probe(this.setup, this.agent) // see dataProbe.js
      await probe.read(this.endpoint) // read xml into probe.jsTree, probe.nodes, check for path collisions - exit if unresolved
      await probe.write(this.db) // write/sync dataitems to db, get probe.indexes
      this.instanceId = probe.instanceId

      // current - get last known values of all dataitems and write to db
      current: do {
        console.log(`Relay starting current loop`)
        const current = new Observations('current', this.agent)
        await current.read(this.endpoint) // get observations and this.sequence numbers
        if (instanceIdChanged(current, probe)) break probe
        await current.write(this.db, probe.indexes) // write this.observations to db
        this.from = current.sequence.next
        // make sure our count value is not over the agent buffer size,
        // else next sample read would get an error.
        if (this.count > current.sequence.size) {
          this.count = current.sequence.size
        }

        // sample - get sequence of dataitem values, write to db
        const sample = new Observations('sample', this.agent)
        sample: do {
          console.log(`Relay starting sample loop`)
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
          if (instanceIdChanged(sample, probe)) break probe // go back and read probe again
          if (!status) {
            console.log(`Relay increasing throughput by`, increaseCount)
            // handle out of range error during read by increasing throughput
            this.count += increaseCount // the number of observations to read next time
            // this.interval -= 100 // and/or decrease interval
            break current
          }
          await sample.write(this.db, probe.indexes) // write this.observations to db
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

// helpers

function instanceIdChanged(data1, data2) {
  if (data1.instanceId !== data2.instanceId) {
    console.log(
      `Relay Agent's instanceId changed - falling back to probe loop...`
    )
    return true
  }
  return false
}
