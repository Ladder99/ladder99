// Observations
// read current and sample endpoints and write data to db
// called from agentReader

import { Data } from './data.js'
import * as treeObservations from './treeObservations.js'
import * as metrics from './metrics.js'

export class Observations extends Data {
  constructor(type) {
    super()
    this.type = type // used by read method - will be 'current' or 'sample'
    // this.previousTime = null
  }

  // read dataitem values from current/sample endpoints as .json,
  // convert .json tree to .observations (flat list of elements).
  async read() {
    await super.read(...arguments) // see base class in data.js

    // get flat list of observations from xml tree
    // observations is [{ tag, dataItemId, name, timestamp, value }, ...]
    this.observations = treeObservations.getElements(this.json)

    // sort observations by timestamp asc, for correct state machine transitions.
    // because sequence nums could be out of order, depending on network.
    this.observations.sort((a, b) => a.timestampSecs - b.timestampSecs)
  }

  // write values from this.observations to db
  async write(db, indexes) {
    // assign device_id and dataitem_id's to observations
    assignNodeIds(this.observations, indexes)

    // get history records to write to db
    const records = getHistoryRecords(this.observations)

    // write all records to db
    return await db.addHistory(records)

    // this.from = nextSequence
  }

  // do calculations on values and write to db bins table.
  // called from agentReader.js
  // db is database object
  // dimensions is dict with current dimension values,
  //   eg { hour: 15, availability: 'AVAILABLE', operator: 'Alice', ... }
  //   needs to carry over from 'current' endpoint to 'sample',
  //   so need to pass it in here.
  // timers is dict with start times for each bin, eg { availability: 18574734.321 }
  //   ditto re passing this in here.
  // see metrics.js
  async calculate(db, dimensions, timers) {
    // get accumulator bins for given observations
    const accumulators = metrics.getAccumulatorBins(
      this.observations,
      dimensions,
      timers
    )

    // get sql update/insert statement and write to db
    const sql = metrics.getSql(accumulators)
    if (sql) {
      console.log(sql)
      await db.query(sql)
    }
    //. later will write to cache, which will write to db
    // cache.set(cacheKey, { value: bins[key] })

    console.log()
  }
}

// assign device node_id and dataitem node_id to observation objects
function assignNodeIds(observations, indexes) {
  for (let obs of observations) {
    const element = indexes.elementById[obs.dataItemId]
    if (element) {
      // note: these had been tacked onto the element objects during index creation.
      obs.device_id = element.device_id
      obs.dataitem_id = element.dataitem_id
    } else {
      console.log(
        `Warning: elementById index missing dataItem ${obs.dataItemId}`
      )
    }
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
