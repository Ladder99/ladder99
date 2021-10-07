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
    //. eg elements = [{}, ...]
    const elements = tree.getElements(this.json)

    // // get devices, dataitems
    // //. eg objs = [{}, ...]
    // const objs = tree.getObjects(elements)

    // get devices, all dataitems with unique paths
    //. eg nodes = [{}, ...]
    // const nodes = tree.getNodes(objs)
    const nodes = tree.getNodes(elements)

    // add/get nodes to db - devices and dataitems
    for (let node of nodes) {
      node.node_id = await db.add(node) // write db
    }

    //. get indexes, { }
    // this.indexes = tree.getIndexes(nodes, objs)
    this.indexes = tree.getIndexes(nodes, elements)

    console.log('indexes', this.indexes)
  }
}
