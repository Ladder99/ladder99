// Observations
// read current and sample endpoints and write data to db
// called from agentReader

import { Data } from './data.js'
import * as treeObservations from './treeObservations.js'
import { updateMetrics } from './metrics.js'

export class Observations extends Data {
  constructor(type) {
    super()
    this.type = type // used by read method
    // this.bins = {} // bins for calculate method
    // this.previousTime = null
  }

  async read() {
    //. see old/dataObs.js for old code starting to handle errors and gaps etc -
    // for dynamic start/count adjustment
    await super.read(...arguments) // see base class in data.js

    // get flat list of observations from xml tree
    // observations is [{ tag, dataItemId, name, timestamp, value }, ...]
    this.observations = treeObservations.getElements(this.json)

    // sort observations by timestamp asc, for correct state machine transitions.
    // because sequence nums could be out of order, depending on network.
    this.observations.sort((a, b) => a.timestampSecs - b.timestampSecs)
  }

  // write values to db
  async write(db, indexes) {
    // build up an array of history records to write
    // see https://stackoverflow.com/a/63167970/243392
    const records = []
    for (let obs of this.observations) {
      const element = indexes.elementById[obs.dataItemId]
      if (element) {
        //. these had been tacked onto the element objects during index creation
        const { device_id, dataitem_id } = element
        // obs.value is always string, due to the way the xml is stored, like <value>10</value>
        //. better to use dataitem category to convert to number?
        //  ie SAMPLES are numeric, EVENTS are strings
        // but not always
        //. keep in mind that conditions can have >1 value also
        const value = Number(obs.value) || JSON.stringify(obs.value)
        const record = {
          node_id: device_id,
          dataitem_id,
          time: obs.timestamp,
          value,
        }
        records.push(record)
      } else {
        // console.log(`Warning: objById index missing dataItem ${obs.dataItemId}`)
        console.log(
          `Warning: elementById index missing dataItem ${obs.dataItemId}`
        )
      }
    }

    // write all records to db
    return await db.addHistory(records)

    // this.from = nextSequence
  }

  // do calculations on values and write to db bins table
  // called from agentReader.js
  // db is database object
  // indexes is dict of indexes referring to probe dataitems (needed?)
  // currentDimensionValues is dict with current dimension values,
  //   eg { hour: 15, availability: 'AVAILABLE', operator: 'Alice', ... }
  // startTimes is dict with start times for each bin, eg { availability: 18574734.321 }
  //   this needs to carry over from 'current' endpoint to 'sample',
  //   so need to pass it in here.
  // see metrics.js
  async calculate(db, currentDimensionValues, startTimes) {
    updateMetrics(db, currentDimensionValues, startTimes, this.observations)
  }
}
