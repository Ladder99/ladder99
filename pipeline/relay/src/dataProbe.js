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
    // get devices, descriptions, dataitems, compositions from xml/json.
    // eg [{node_type, path, id, name, device, category}, ...]
    const elements = tree.getElements(this.json)

    // get devices and dataitems with unique paths.
    // nodes are just what we'll add to the db, elements are more complete.
    // nodes should just include devices and dataitems.
    // eg [{node_type, path, category}, ...]
    const nodes = tree.getNodes(elements)

    // add/get nodes to db - devices and dataitems
    //. maybe should just get nodes here from elements with simple filter?
    for (let node of nodes) {
      node.node_id = await db.add(node) // write to db and save resulting node_id
    }

    // get indexes - nodeByPath, nodeById, elementById
    //. why do we need those 3 indexes?
    this.indexes = tree.getIndexes(nodes, elements)

    // assign device_id and dataitem_id to dataitem elements.
    // need these to write values to history table.
    tree.updateElements(this.indexes, elements)

    console.log('indexes', this.indexes)
  }
}
