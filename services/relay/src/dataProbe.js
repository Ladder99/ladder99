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

    // check for path collisions - in which case stop the service with a message
    // to add translation step to setup.yaml.
    const collisions = await this.getPathCollisions()
    if (collisions.length > 0) {
      console.log(`
Relay error: The following dataitems have duplicate paths, 
ie same positions in the XML tree and type+subtype. 
Please add translations for them in setup.yaml for this project.

eg with the following output,
  [
    [
      { id: 'Cload', path: 'Mazak5701/d1/base/rotary[c]/load' },
      { id: 'Sload', path: 'Mazak5701/d1/base/rotary[c]/load' }
    ]
  ]

you could add the following translation block to setup.yaml:
  relay:
    agents:
      - alias: Mazak5701
        url: http://mtconnect.mazakcorp.com:5701
        devices:
          - id: d1
            alias: MazakMill12345
            translations:
              Cload: load-index
              Sload: load-spindle

giving the following unique paths -
  Mazak5701/d1/base/rotary[c]/load-index
  Mazak5701/d1/base/rotary[c]/load-spindle
`)
      // console.log(collisions)
      console.log(
        collisions.map(collision =>
          collision.map(node => ({ id: node.id, path: node.path }))
        )
      )
      await new Promise(resolve => setTimeout(resolve, 5000)) // pause
      process.exit(1)
    }
  }

  // get list of path collisions
  async getPathCollisions() {
    // get dict with path=>[node1, node2, ...]
    const pathNodes = {}
    for (let node of this.nodes) {
      if (pathNodes[node.path]) {
        pathNodes[node.path].push(node)
      } else {
        pathNodes[node.path] = [node]
      }
    }
    // get list of collisions
    const collisions = []
    for (let key of Object.keys(pathNodes)) {
      if (pathNodes[key].length > 1) {
        collisions.push(pathNodes[key])
      }
    }
    return collisions
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
