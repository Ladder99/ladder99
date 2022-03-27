// Probe
// read probe endpoint data and write to db - called from agentReader

import { Data } from './data.js'
import * as tree from './treeProbe.js'

export class Probe extends Data {
  type = 'probe' // used by read method

  constructor(setup) {
    super()
    this.setup = setup
  }

  // read json into this.json, this.header, then parse .json tree into
  // flat list of .elements and .nodes.
  async read() {
    await super.read(...arguments) // see base class in data.js

    // get flat list of devices, descriptions, dataitems, compositions from xml/json.
    // eg [{node_type, path, id, name, device, category}, ...]
    this.elements = tree.getElements(this.json) // see treeProbe.js

    // get devices and dataitems with unique paths.
    // nodes are just what we'll add to the db, elements are more complete.
    // nodes should just include devices and dataitems, with eg node_type='Device'
    // eg [{node_type, path, category}, ...]
    this.nodes = tree.getNodes(this.elements) // see treeProbe.js

    //. translate paths in this.nodes to canonical paths, if specified in this.setup
    this.translate()
  }

  translate() {
    // this.setup
  }

  // write probe data in .json to db instance, get indexes
  async write(db) {
    // add/get nodes to db - devices and dataitems
    //. maybe should just get nodes here from elements with simple filter?
    // ie filter from all elements to just dataitems? uhh
    for (let node of this.nodes) {
      //. this is upsert - call it so
      node.node_id = await db.add(node) // write to db and save resulting node_id
    }

    // get indexes - nodeByNodeId, nodeByPath, elementById
    //. why do we need those 3 indexes? explain
    //. nodeByNodeId - gives node object for a given node_id, eg 3 -> {}
    //. nodeByPath - gives node object for given path, eg __
    //. elementById - gives element object for given dataitem id, eg 'pr1-avail' -> {}
    this.indexes = tree.getIndexes(this.nodes, this.elements)

    // assign device_id and dataitem_id to dataitem elements.
    // will need these to write values from current/sample endpoints
    // to history and bins tables.
    tree.assignNodeIds(this.elements, this.indexes)

    // console.log('indexes', this.indexes)
  }
}
