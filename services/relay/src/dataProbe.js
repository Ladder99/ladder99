// Probe
// read probe endpoint data and write to db - called from agentReader

import { Data } from './data.js'
import * as tree from './treeProbe.js'

export class Probe extends Data {
  type = 'probe' // used by this.read()

  constructor(setup, agent) {
    super()
    this.setup = setup
    this.agent = agent
  }

  // read xml into this.jsTree, this.header, then parse jsTree into
  // flat list of .nodes.
  async read() {
    await super.read(...arguments) // gets this.jsTree - see base class in data.js

    // // get flat list of devices, descriptions, dataitems, compositions from xml/js.
    // // eg [{node_type, path, id, name, device, category}, ...]
    // this.elements = tree.getElements(this.jsTree) // see treeProbe.js

    // // get devices and dataitems with unique paths.
    // // nodes are just what we'll add to the db, elements are more complete.
    // // nodes should just include devices and dataitems, with eg node_type='Device'
    // // eg [{node_type, path, category}, ...]
    // this.nodes = tree.getNodes(this.elements, this.setup) // see treeProbe.js

    this.nodes = tree.getNodes(this.jsTree, this.setup, this.agent) // see treeProbe.js
  }

  // write probe data in jsTree to db instance, get indexes
  async write(db) {
    // add/get nodes to db - devices and dataitems
    for (let node of this.nodes) {
      //. this is upsert - call it so
      // node.node_id = await db.add(node) // write to db and save resulting node_id
      node.node_id = await db.addOrGet(node) // write to db and save resulting node_id
    }

    // get indexes - nodeByNodeId, nodeByFullid
    //. why do we need those indexes? explain
    //. nodeByNodeId - gives node object for a given node_id, eg 3 -> {}
    //. nodeByFullid - gives node object for given fullid, eg 'main/d1/avail' -> {}
    this.indexes = tree.getIndexes(this.nodes)

    // assign device_id and dataitem_id to dataitem elements.
    // will need these to write values from current/sample endpoints
    // to history and bins tables.
    tree.assignNodeIds(this.elements, this.indexes)

    // console.log('indexes', this.indexes)
  }
}
