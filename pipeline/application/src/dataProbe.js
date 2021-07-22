// Probe

// import fs from 'fs'
import { Data } from './data.js'
import { Graph } from './graph.js'
// import * as libapp from './libapp.js'
import * as tree from './tree.js'

export class Probe extends Data {
  type = 'probe'

  // see base class Data for read method
  // reads json into .json

  // write probe data in .json to db instance
  async write(db) {
    // get lists of objs from json
    //. move this to the read or a parse method?
    const objs = tree.getProbeObjects(this.json)
    console.log('objs', objs)

    // const nodesPath = 'nodes-ex.json'
    // fs.writeFileSync(nodesPath, JSON.stringify(nodes, null, 2))
    // process.exit(0)

    // read db nodes into array, compare, add missing dataitem records
    //. what if other agentreader is writing props at same time though?
    //. i guess need to write propdefs one by one, catch error from db.
    // const graphDb = new Graph()
    // await graphDb.read(db)
    // console.log('graphdb', graphDb)

    // compare nodes with db nodes, get add/update/delete lists
    const missingNodes = []
    for (let node of nodes) {
      if (node.tag === 'Device' || node.tag === 'DataItem') {
        const isMissing = !graphDb.nodes.has(node.id) //. use { id: node.id }
        if (isMissing) {
          // const n = graphDb.nodes.get(node.id)
          console.log(`add node to db:`, node)
          //. add to db - how do? add to a list for now, or flag it
          // node.addToDb = true
          missingNodes.push(node)
        }
      }
    }

    // add missing node records
    //. hide sql inside the db module
    if (missingNodes.length > 0) {
      const records = missingNodes
        .map(node => {
          // eg '{"email": "thom22@gmail.com", "country": "US"}'
          return `'${JSON.stringify(node)}'`
        })
        .join(',\n')
      const sql = `INSERT INTO nodes (props) VALUES (${records});`
      console.log(sql)
      //. add try catch block - ignore error? or just print it?
      // const res = await db.query(sql)
      // console.log(res)
    }

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
