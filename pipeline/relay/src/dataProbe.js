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
    // get devices, descriptions, dataitems, compositions
    //. eg elements = [{}, ...]
    const elements = tree.getElements(this.json)

    // get devices, dataitems with unique paths
    //. eg nodes = [{}, ...]
    const nodes = tree.getNodes(elements)

    // add/get nodes to db - devices and dataitems
    for (let node of nodes) {
      node.node_id = await db.add(node) // write db
    }

    // get indexes - nodeByPath, nodeById, elementById
    //. why do we need those 3 indexes?
    this.indexes = tree.getIndexes(nodes, elements)

    // assign device_id and dataitem_id to dataitem elements
    //. why?
    elements.forEach(element => {
      if (element.node_type === 'DataItem') {
        element.device_id = this.indexes.nodeByPath[element.device].node_id
        element.dataitem_id = this.indexes.nodeByPath[element.path].node_id
      }
    })

    console.log('indexes', this.indexes)
  }
}
