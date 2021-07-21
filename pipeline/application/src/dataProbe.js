// Probe

import fs from 'fs'
import { Data } from './data.js'
import { Graph } from './graph.js'
import * as libapp from './libapp.js'

export class Probe extends Data {
  type = 'probe'

  // see base class Data for read method
  // reads json into .json

  // write probe data in .json to db instance
  async write(db) {
    // get lists of nodes and edges from json
    //. return them from a fn, eg const graph = libapp.getGraph(this.json) => { nodes, edges }?
    //. move this to read or parse method?
    const nodes = []
    const edges = []
    libapp.traverse(this.json, nodes, edges)
    console.log('nodes', nodes)

    // const nodesPath = 'nodes-ex.json'
    // fs.writeFileSync(nodesPath, JSON.stringify(nodes, null, 2))
    // process.exit(0)

    //. read db nodes into array, compare, add missing dataitem records
    const graphDb = new Graph()
    await graphDb.read(db)
    console.log('graphdb', graphDb)

    // for (let node of nodes) {
    //   if (!graphDb.nodes.has(node.id)) {
    //     console.log(`add node to db:`, node)
    //   }
    // }

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
