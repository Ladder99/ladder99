// Probe

import fs from 'fs'
import { Data } from './data.js'
import * as libapp from './libapp.js'

export class Probe extends Data {
  type = 'probe'

  // see base class Data for read method
  // reads json into .json

  // write probe data in .json to db instance
  async write(db) {
    // get lists of nodes and edges from json
    //. return them from a fn, eg const graph = libapp.getGraph(this.json) => { nodes, edges }
    const nodes = []
    const edges = []
    libapp.traverse(this.json, nodes, edges)
    // console.log(nodes)

    // const nodesPath = 'nodes-ex.json'
    // fs.writeFileSync(nodesPath, JSON.stringify(nodes, null, 2))
    // process.exit(0)

    // const probeGraph = data.getProbeGraph() // get probe data into graph structure
    // libapp.print(probeGraph)
    // const dbGraph = new Graph()
    // await dbGraph.read(this.db)
    // //. now compare probe graph with db graph, update db as needed
    // await probeGraph.write(this.db)
    // await probeGraph.synchTo(this.db)
  }
}
