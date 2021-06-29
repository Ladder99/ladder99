// Probe

import fs from 'fs'
import { Data } from './data.js'
import * as libapp from './libapp.js'

export class Probe extends Data {
  type = 'probe'

  // async read(endpoint) {
  //   this.json = await endpoint.fetchJson('probe')
  //   this.parseHeader()
  // }

  async write(db) {
    console.log(this.json)
    const nodes = []
    const edges = []
    libapp.traverse(this.json, nodes, edges)
    console.log(nodes)
    // console.log(nodes.slice(0, 20))
    const nodesPath = '/Users/bburns/Desktop/nodes.json'
    fs.writeFileSync(nodesPath, JSON.stringify(nodes, null, 2))

    // const probeGraph = data.getProbeGraph() // get probe data into graph structure
    // libapp.print(probeGraph)
    // const dbGraph = new Graph()
    // await dbGraph.read(this.db)
    //. now compare probe graph with db graph, update db as needed
    // await probeGraph.write(this.db)
    // await probeGraph.synchTo(this.db)
  }
}
