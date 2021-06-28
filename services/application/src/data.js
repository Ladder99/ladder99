// data
// wraps agent data returned from probe, current, and sample endpoints

import * as libapp from './libapp.js'

export class Data {
  type = null

  constructor() {
    this.json = null
    this.errors = null
    this.header = null
    this.instanceId = null
  }

  async read(endpoint) {
    this.json = await endpoint.fetchJson(this.type)
    this.parseHeader()
  }

  // get errors, header, and instanceId from json
  parseHeader() {
    // eg <Errors><Error errorCode="OUT_OF_RANGE">'from' must be greater than 647331</Error></Errors>
    if (this.json.MTConnectError) {
      this.errors = this.json.MTConnectError.Errors.map(e => e.Error.errorCode)
      throw new Error(JSON.stringify(this.errors))
    }
    this.header = this.json.MTConnectDevices
      ? this.json.MTConnectDevices.Header
      : this.json.MTConnectStreams.Header
    this.instanceId = this.header.instanceId
  }
}

// Probe

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

    // const probeGraph = data.getProbeGraph() // get probe data into graph structure
    // libapp.print(probeGraph)
    // const dbGraph = new Graph()
    // await dbGraph.read(this.db)
    //. now compare probe graph with db graph, update db as needed
    // await probeGraph.write(this.db)
    // await probeGraph.synchTo(this.db)
  }
}

// Current

// export class CurrentData extends Data {
// async write(data) {
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
// }

// Sample

// export class SampleData extends Data {

// async write(data) {
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

//   async fetchSample() {
//     this.from = null
//     this.count = this.fetchCount
//     let data
//     let errors
//     do {
//       const json = await this.endpoint.fetchData(
//         'sample',
//         this.from,
//         this.count
//       )
//       data = new Data(json)
//       // check for errors
//       // eg <Error errorCode="OUT_OF_RANGE">'from' must be greater than 647331</Error>
//       // if (json.MTConnectError) {
//       errors = data.getErrors()
//       if (errors) {
//         console.log(data)
//         const codes = errors.map(e => e.Error.errorCode)
//         if (codes.includes('OUT_OF_RANGE')) {
//           // we lost some data, so reset the index and get from start of buffer
//           console.log(
//             `Out of range error - some data was lost. Will reset index and get as much as possible from start of buffer.`
//           )
//           this.from = null
//           //. adjust fetch count/speed
//         }
//       }
//     } while (errors)
//     return data
//   }
// }
