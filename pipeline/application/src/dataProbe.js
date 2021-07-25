// Probe
// called from agentReader

// import fs from 'fs'
import { Data } from './data.js'
// import { Graph } from './graph.js'
// import * as libapp from './libapp.js'
import * as tree from './tree.js'

export class Probe extends Data {
  type = 'probe'

  // see base class Data for read method
  // reads json into this.json, this.header etc

  // write probe data in .json to db instance, get indexes
  async write(db) {
    const objs = tree.getObjects(this.json) // get devices, dataitems
    const nodes = tree.getNodes(objs) // get devices, unique propdefs

    // add/get nodes to db - devices and propdefs
    for (let node of nodes) {
      node.node_id = await db.add(node)
    }

    this.indexes = tree.getIndexes(nodes, objs) // get { objById }

    // db.disconnect()
    // process.exit(0)
  }
}
