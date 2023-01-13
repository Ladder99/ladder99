// Observations
// read current and sample endpoints and write data to db.
// called from agentReader.

import { Data } from './data.js'
import * as treeObservations from './treeObservations.js'

// Observations - stores an array of observations - current or sample
export class Observations extends Data {
  //
  constructor(type, agent) {
    super()
    this.type = type // used by read method - will be 'current' or 'sample'
    this.agent = agent
    this.observations = null // array of dataitems
  }

  // read dataitem values from current/sample endpoints as xml/js tree,
  // convert .jsTree to .observations (flat list of elements).
  // parameters are (endpoint) or (endpoint, from, count)
  async read() {
    // super.read will return false if gets an xml error message
    if (!(await super.read(...arguments))) return false // see base class in data.js

    // get flat list of observations from xml tree
    // observations is [{ tag, dataItemId, name, timestamp, value }, ...]
    // eg [{
    //   tag: 'Availability',
    //   dataItemId: 'm1-avail',
    //   name: 'availability',
    //   sequence: '30',
    //   timestamp: '2021-09-14T17:53:21.414Z',
    //   value: 'AVAILABLE'
    // }, ...]
    this.observations = treeObservations.getNodes(this.jsTree, this.agent)

    // sort observations by timestamp asc, for correct state machine transitions.
    // because sequence nums could be out of order, depending on network.
    this.observations.sort((a, b) => a.timestampSecs - b.timestampSecs)

    return true
  }

  // write values from this.observations to db
  async write(db, indexes) {
    //
    // assign device_id and dataitem_id's to observations
    // treeObservations.assignNodeIds(this.observations, indexes)
    treeObservations.addElementInfo(this.observations, indexes)

    // get history records to write to db
    // observations is now [{ device_id, dataitem_id, tag, dataItemId, name, timestamp, value }, ...]
    //. records is
    const records = getHistoryRecords(this.observations)

    // write all records to db
    return await db.addHistory(records)
  }
}

// build up an array of history records to write
// see https://stackoverflow.com/a/63167970/243392
//. this hardly does anything now
// just filters down to dataitem's we're interested in, converts value to num/string
function getHistoryRecords(observations) {
  const records = []
  for (let obs of observations) {
    if (obs.dataitem_id) {
      // obs.value is always string, due to the way the xml is stored, like <value>10</value>
      // use dataitem category to convert to number
      // ie SAMPLES are numeric, EVENTS are strings
      //. convert 'UNAVAILABLE' samples to null?
      //. keep in mind that conditions can have >1 value also
      // const value = Number(obs.value) || JSON.stringify(obs.value) // bug: this converted 0's to "0" - should have used ?? operator
      // try to convert to number - if not, convert to a json string, eg 'AVAILABLE' -> '"AVAILABLE"'
      const nval = Number(obs.value) // try convert to number //. what if value is 'UNAVAILABLE' or null? then get NaN or 0 (!)
      // const value = Number.isNaN(nval) ? JSON.stringify(obs.value) : nval
      const useNumber = obs.category === 'SAMPLE' && !Number.isNaN(nval)
      const value = useNumber ? nval : JSON.stringify(obs.value)
      const record = {
        node_id: obs.device_id,
        dataitem_id: obs.dataitem_id,
        time: obs.timestamp,
        value, // number or string - written as jsonb value
      }
      records.push(record)
    }
  }
  return records
}
