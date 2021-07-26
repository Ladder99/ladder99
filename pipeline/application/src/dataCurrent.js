// Current
// read current endpoint data and write to db - called from agentReader

import { Data } from './data.js'
import * as treeObservations from './treeObservations.js'

export class Current extends Data {
  type = 'current' // used by read method

  // for read method, see base class Data

  async write(db, indexes) {
    // get flat list of observations from xml/json
    const observations = treeObservations.getElements(this.json)

    for (let obs of observations) {
      const node = indexes.objById[obs.dataItemId]
      if (node) {
        const { device_id, property_id } = node
        console.log(
          `write to node ${device_id}, property ${property_id}, time ${obs.timestamp}, value ${obs.value}`
        )
        const record = {
          node_id: device_id,
          property_id,
          time: obs.timestamp,
          value: JSON.stringify(obs.value), //. okay with numbers also?
        }
        console.log(record)
        await db.addHistory(record) // write db
      }
    }
  }
}
