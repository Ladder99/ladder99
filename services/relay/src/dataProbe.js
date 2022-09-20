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

  // read xml into this.jsTree, this.header, then parse jsTree into flat list of .nodes.
  async read() {
    await super.read(...arguments) // gets this.jsTree - see base class in data.js

    // get flat list of devices, descriptions, dataitems, compositions from xml/js.
    // eg [{node_type, path, category}, ...]
    this.nodes = tree.getNodes(this.jsTree, this.agent) // see treeProbe.js
  }

  // write probe data in jsTree to db instance, get indexes
  async write(db) {
    //
    // add/get nodes to db - devices and dataitems
    for (let node of this.nodes) {
      node.node_id = await db.upsert(node) // write/read db and save resulting node_id
    }

    // get indexes -
    // nodeByUid - gives node object for given uid, eg 'Main/m-avail' -> {...}
    this.indexes = tree.getIndexes(this.nodes)

    // assign device_id and dataitem_id to dataitem elements.
    // will need these to write values from current/sample endpoints
    // to history and bins tables.
    tree.assignNodeIds(this.nodes, this.indexes)
  }
}
