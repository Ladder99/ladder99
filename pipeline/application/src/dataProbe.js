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
  // reads json into this.json

  // write probe data in .json to db instance
  async write(db) {
    // get lists of objs from json
    //. move this to the read or a parse method?
    // const objs = tree.getProbeObjects(this.json)

    // const dict = tree.getProbeDict(this.json)

    // get objects (devices, all dataitems)
    const objs = tree.getObjects(this.json)

    // get nodes (devices, unique propdefs)
    const nodes = tree.getNodes(objs)

    this.indexes = {
      nodeById: {},
      nodeByPath: {},
    }

    // add nodes to db - devices and propdefs
    for (let node of nodes) {
      node.node_id = await db.add(node)
      this.indexes.nodeById[node.node_id] = node
      this.indexes.nodeByPath[node.path] = node
    }
    console.log({ nodes })

    // assign device_id and property_id to dataitems
    objs.forEach(obj => {
      if (obj.type === 'DataItem') {
        obj.device_id = this.indexes.nodeByPath[obj.device]
        obj.property_id = this.indexes.nodeByPath[obj.path]
      }
    })
    console.log({ objs })

    db.disconnect()
    process.exit(0)
  }
}
