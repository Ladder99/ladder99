// Probe
// read probe endpoint data and write to db - called from agentReader

import { Data } from './data.js'
import * as tree from './treeProbe.js'

export class Probe extends Data {
  type = 'probe' // used by read method

  // see base class Data for read method
  // reads json into this.json, this.header etc

  // write probe data in .json to db instance, get indexes
  async write(db) {
    // get devices, dataitems
    const elements = tree.getElements(this.json)

    // get devices, dataitems
    //. eg objs =
    const objs = tree.getObjects(elements)

    //. make paths unique

    // get devices, dataitems with unique paths
    //. eg nodes =
    const nodes = tree.getNodes(objs)

    // add/get nodes to db - devices and dataitems
    for (let node of nodes) {
      node.node_id = await db.add(node) // write db
    }

    // get indexes, incl objById
    this.indexes = tree.getIndexes(nodes, objs)

    console.log('indexes', this.indexes)
  }
}
