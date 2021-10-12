// Probe
// read probe endpoint data and write to db - called from agentReader

import { Data } from './data.js'
import * as tree from './treeProbe.js'

export class Probe extends Data {
  type = 'probe' // used by read method

  // read json into this.json, this.header, then parse .json tree into
  // flat list of .elements and .nodes.
  async read() {
    await super.read(...arguments) // see base class in data.js

    // get flat list of devices, descriptions, dataitems, compositions from xml/json.
    // eg [{node_type, path, id, name, device, category}, ...]
    this.elements = tree.getElements(this.json)

    // get devices and dataitems with unique paths.
    // nodes are just what we'll add to the db, elements are more complete.
    // nodes should just include devices and dataitems.
    // eg [{node_type, path, category}, ...]
    this.nodes = tree.getNodes(this.elements)
  }

  // write probe data in .json to db instance, get indexes
  async write(db) {
    // add/get nodes to db - devices and dataitems
    //. maybe should just get nodes here from elements with simple filter?
    for (let node of this.nodes) {
      node.node_id = await db.add(node) // write to db and save resulting node_id
    }

    // get indexes - nodeByPath, nodeById, elementById
    //. why do we need those 3 indexes?
    //. nodeByPath - used for
    //. nodeById -
    //. elementById -
    this.indexes = tree.getIndexes(this.nodes, this.elements)

    // assign device_id and dataitem_id to dataitem elements.
    // will need these to write values from current/sample endpoints to history table.
    tree.updateElements(this.indexes, this.elements)

    console.log('indexes', this.indexes)
  }
}
