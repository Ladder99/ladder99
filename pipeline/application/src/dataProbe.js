// Probe

// import fs from 'fs'
import { Data } from './data.js'
import { Graph } from './graph.js'
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
    // console.log('objs', objs)

    // const records = tree.getProbeDicts(this.json)
    // const { devices, propdefs } = records

    // // add devices
    // for (let device of Object.values(devices)) {
    //   await db.add(device)
    // }

    // // add propdefs
    // for (let propdef of Object.values(propdefs)) {
    //   await db.add(propdef)
    // }

    const dict = tree.getProbeDict(this.json)

    // add nodes to db - devices and propdefs
    const nodes = Object.values(dict)
    for (let node of nodes) {
      await db.add(node)
    }

    // const nodesPath = 'nodes-ex.json'
    // fs.writeFileSync(nodesPath, JSON.stringify(nodes, null, 2))
    // process.exit(0)

    process.exit(0)

    // const probeGraph = data.getProbeGraph() // get probe data into graph structure
    // libapp.print(probeGraph)
    // const dbGraph = new Graph()
    // await dbGraph.read(this.db)
    // //. now compare probe graph with db graph, update db as needed
    // await probeGraph.write(this.db)
    // await probeGraph.synchTo(this.db)
  }
}
