// Observations
// read current and sample endpoints and write data to db.
// called from agentReader.

import { Data } from './data.js'
import * as treeObservations from './treeObservations.js'

// Observations - stores an array of observations - current or sample
export class Observations extends Data {
  constructor(type) {
    super()
    this.type = type // used by read method - will be 'current' or 'sample'
    this.observations = null // array of dataitems
  }

  // read dataitem values from current/sample endpoints as .json,
  // convert .json tree to .observations (flat list of elements).
  async read() {
    await super.read(...arguments) // see base class in data.js

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
    this.observations = treeObservations.getElements(this.json)

    // sort observations by timestamp asc, for correct state machine transitions.
    // because sequence nums could be out of order, depending on network.
    this.observations.sort((a, b) => a.timestampSecs - b.timestampSecs)
  }

  // write values from this.observations to db
  async write(db, indexes) {
    //
    // assign device_id and dataitem_id's to observations
    treeObservations.assignNodeIds(this.observations, indexes)
    // observations is now [{ device_id, dataitem_id, tag, dataItemId, name, timestamp, value }, ...]

    // get history records to write to db
    //. records is
    const records = getHistoryRecords(this.observations)

    // write all records to db
    return await db.addHistory(records)

    // this.from = nextSequence
  }
}

// build up an array of history records to write
// see https://stackoverflow.com/a/63167970/243392
//. uhh, this hardly does anything now
// just filters down to dataitem's we're interested in, converts value to num/string
function getHistoryRecords(observations) {
  const records = []
  for (let obs of observations) {
    if (obs.dataitem_id) {
      // obs.value is always string, due to the way the xml is stored, like <value>10</value>
      //. better to use dataitem category to convert to number?
      //  ie SAMPLES are numeric, EVENTS are strings
      //.. convert UNAVAILABLEs to null?
      //. keep in mind that conditions can have >1 value also
      const value = Number(obs.value) || JSON.stringify(obs.value)
      const record = {
        node_id: obs.device_id,
        dataitem_id: obs.dataitem_id,
        time: obs.timestamp,
        value,
      }
      records.push(record)
    }
  }
  return records
}
