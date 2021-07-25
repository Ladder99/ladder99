// Current

import { Data } from './data.js'
import * as libapp from './libapp.js'
import * as treeObservations from './treeObservations.js'

export class Current extends Data {
  // see base class Data for read method
  // reads json into this.json, this.header etc

  async write(db, indexes) {
    // get sequence info from header
    const { firstSequence, nextSequence, lastSequence } = this.header

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
          value: obs.value,
        }
        console.log(record)
        await db.addHistory(record) // write db
      }
    }

    // this.from = nextSequence
    // const dataitems = data.getCurrentData()
    // const dataItems = getDataItems(data)
    // await db.writeDataItems(dataItems)
    // await db.writeGraphValues(graph)
    // console.log(dataitems)
  }
}
