// agent
// class to represent an agent - handles probe, current, sample loop

import { Data } from './data.js'
import * as libapp from './libapp.js'

export class Agent {
  constructor({ db, endpoint, params }) {
    this.db = db
    this.endpoint = endpoint
    this.params = params
    //
    this.from = null
    //. these will be dynamic - optimize on the fly
    this.interval = params.fetchInterval
    this.count = params.fetchCount
  }

  // // init agent
  // async init() {
  //   //. read probe info incl device info?
  //   //. read dataitems.yaml to translate shdr id to canonical id?
  //   //. or do that with a path-to-canonicalId translator?
  // }

  // start fetching and processing data
  async start() {
    // get device structures and write to db
    //. will need to compare with existing graph structure in db and add/update as needed
    let instanceId = null
    probe: do {
      const data = await Data.getProbeData(this.endpoint)
      instanceId = data.instanceId
      await this.handleProbeData(data) // update db

      process.exit(0)

      // // get last known values of all dataitems, write to db
      // current: do {
      //   const data = await Data.getCurrentData(this.endpoint)
      //   if (instanceIdChanged(data, instanceId)) break probe
      //   await this.handleCurrentData(data) // update db

      //   // get sequence of dataitem values, write to db
      //   sample: do {
      //     // // const data = await this.fetchSample()
      //     // const data = await Data.getSampleData(this.endpoint, from, count)
      //     // if (instanceIdChanged(data, instanceId)) break probe
      //     // await this.handleSampleData(data)
      //     // console.log('.')
      //     // await libapp.sleep(this.fetchInterval)
      //   } while (true)
      // } while (true)
    } while (true)
  }

  async handleProbeData(data) {
    // const probeGraph = data.getProbeGraph() // get probe data into graph structure
    // libapp.print(probeGraph)
    // const dbGraph = new Graph()
    // await dbGraph.read(this.db)
    //. now compare probe graph with db graph, update db as needed
    // await probeGraph.write(this.db)
    // await probeGraph.synchTo(this.db)
  }

  // async handleCurrentData(data) {
  //   // get sequence info from header
  //   // const { firstSequence, nextSequence, lastSequence } =
  //   //   data.json.MTConnectStreams.Header
  //   // this.from = nextSequence
  //   const dataitems = data.getCurrentData()
  //   // const dataItems = getDataItems(data)
  //   // await db.writeDataItems(dataItems)
  //   // await db.writeGraphValues(graph)
  //   console.log(dataitems)
  // }

  // async handleSampleData(data) {
  //   // get sequence info from header
  //   // const header = json.MTConnectStreams.Header
  //   const header = data.getHeader()
  //   const { firstSequence, nextSequence, lastSequence } = header
  //   this.from = nextSequence

  //   const dataItems = data.getDataItems()
  //   await this.writeDataItems(dataItems)

  //   // //. if gap, fetch and write that also
  //   // const gap = false
  //   // if (gap) {
  //   //   const json = await fetchAgentData('sample', sequences.from, sequences.count)
  //   //   const dataItems = getDataItems(json)
  //   //   await writeDataItems(db, dataItems)
  //   // }
  // }

  // // gather up all items into array, then put all into one INSERT stmt, for speed.
  // // otherwise pipeline couldn't keep up.
  // // see https://stackoverflow.com/a/63167970/243392 etc
  // async writeDataItems(dataItems) {
  //   //. write to db with arrays - that will translate to sql
  //   let rows = []
  //   for (const dataItem of dataItems) {
  //     let { dataItemId, timestamp, value } = dataItem
  //     const id = dataItemId
  //     const _id = this.idMap[id]
  //     if (_id) {
  //       value = value === undefined ? 'undefined' : value
  //       if (typeof value !== 'object') {
  //         const type = typeof value === 'string' ? 'text' : 'float'
  //         const row = `('${_id}', '${timestamp}', to_jsonb('${value}'::${type}))`
  //         rows.push(row)
  //       } else {
  //         //. handle arrays
  //         console.log(`**Handle arrays for '${id}'.`)
  //       }
  //     } else {
  //       console.log(`Unknown element id '${id}', value '${value}'.`)
  //     }
  //   }
  //   if (rows.length > 0) {
  //     const values = rows.join(',\n')
  //     const sql = `INSERT INTO history (_id, time, value) VALUES ${values};`
  //     console.log(sql)
  //     //. add try catch block - ignore error? or just print it?
  //     await this.db.query(sql)
  //   }
  // }
}

//

function instanceIdChanged(data, instanceId) {
  if (data.instanceId !== instanceId) {
    console.log(`InstanceId changed - falling back to probe...`)
    return true
  }
  return false
}
