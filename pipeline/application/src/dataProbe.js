// Probe
// called from agentReader

import { Data } from './data.js'
import * as tree from './tree.js'
// import * as libapp from './libapp.js'

export class Probe extends Data {
  type = 'probe' // used by read method

  // see base class Data for read method
  // reads json into this.json, this.header etc

  // write probe data in .json to db instance, get indexes
  async write(db) {
    const objs = tree.getObjects(this.json) // get devices, dataitems
    const nodes = tree.getNodes(objs) // get devices, unique propdefs

    // add/get nodes to db - devices and propdefs
    for (let node of nodes) {
      node.node_id = await db.add(node) // write db
    }

    // get indexes, incl objById
    this.indexes = tree.getIndexes(nodes, objs)

    console.log('indexes', this.indexes)
  }
}
