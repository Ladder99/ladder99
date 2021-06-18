import { Data } from './data.js'
import * as libapp from './libapp.js'

export class Agent {
  constructor({ db, endpoint, params }) {
    this.db = db
    this.endpoint = endpoint
    this.params = params
    //
    this.instanceId = null
    this.idMap = {} // map from element id to integer _id for db tables
    this.fetchFrom = null
    //. these will be dynamic - optimize on the fly
    this.fetchInterval = params.fetchInterval
    this.fetchCount = params.fetchCount
  }

  // start a 'thread' to handle data from the given base agent url
  async start() {
    // get device structures and write to db
    probe: do {
      const data = await this.fetchData('probe')
      if (await data.unavailable()) break probe
      this.instanceId = data.getInstanceId()
      await this.handleProbe(data)

      // get last known values of all dataitems, write to db
      current: do {
        // const data = await this.fetchData('current')
        // if (await data.unavailable()) break current
        // if (data.instanceIdChanged(this.instanceId)) break probe
        // await this.handleCurrent(data)

        // get sequence of dataitem values, write to db
        sample: do {
          // const data = await this.fetchSample()
          // if (await data.unavailable()) break sample
          // if (data.instanceIdChanged(this.instanceId)) break probe
          // await this.handleSample(data)
          await libapp.sleep(this.fetchInterval)
        } while (true)
      } while (true)
    } while (true)
  }

  async fetchData(type) {
    const json = await this.endpoint.fetchData(type)
    const data = new Data(json)
    return data
  }

  async handleProbe(data) {
    console.log(`handleProbe`, data)
    // const graph = data.getGraph()
    // await db.writeGraphStructure(graph)
  }

  async handleCurrent(db, data) {
    // // get sequence info from header
    // const { firstSequence, nextSequence, lastSequence } =
    //   json.MTConnectStreams.Header
    // this.from = nextSequence
    // const dataItems = getDataItems(data)
    // await writeDataItems(db, dataItems)
    // await writeGraphValues(db, graph)
  }

  async fetchSample() {
    this.from = null
    this.count = this.fetchCount
    let data
    let errors
    do {
      const json = await this.endpoint.fetchData(
        'sample',
        this.from,
        this.count
      )
      data = new Data(json)
      // check for errors
      // eg <Error errorCode="OUT_OF_RANGE">'from' must be greater than 647331</Error>
      // if (json.MTConnectError) {
      errors = data.getErrors()
      if (errors) {
        console.log(data)
        const codes = errors.map(e => e.Error.errorCode)
        if (codes.includes('OUT_OF_RANGE')) {
          // we lost some data, so reset the index and get from start of buffer
          console.log(
            `Out of range error - some data was lost. Will reset index and get as much as possible from start of buffer.`
          )
          this.from = null
          //. adjust fetch count/speed
        }
      }
    } while (errors)
    return data
  }

  async handleSample(data) {
    // get sequence info from header
    // const header = json.MTConnectStreams.Header
    const header = data.getHeader()
    const { firstSequence, nextSequence, lastSequence } = header
    this.from = nextSequence

    const dataItems = data.getDataItems()
    await this.writeDataItems(dataItems)

    // //. if gap, fetch and write that also
    // const gap = false
    // if (gap) {
    //   const json = await fetchAgentData('sample', sequences.from, sequences.count)
    //   const dataItems = getDataItems(json)
    //   await writeDataItems(db, dataItems)
    // }
  }

  // gather up all items into array, then put all into one INSERT stmt, for speed.
  // otherwise pipeline couldn't keep up.
  // see https://stackoverflow.com/a/63167970/243392 etc
  async writeDataItems(dataItems) {
    //. write to db with arrays - that will translate to sql
    let rows = []
    for (const dataItem of dataItems) {
      let { dataItemId, timestamp, value } = dataItem
      const id = dataItemId
      const _id = this.idMap[id]
      if (_id) {
        value = value === undefined ? 'undefined' : value
        if (typeof value !== 'object') {
          const type = typeof value === 'string' ? 'text' : 'float'
          const row = `('${_id}', '${timestamp}', to_jsonb('${value}'::${type}))`
          rows.push(row)
        } else {
          //. handle arrays
          console.log(`**Handle arrays for '${id}'.`)
        }
      } else {
        console.log(`Unknown element id '${id}', value '${value}'.`)
      }
    }
    if (rows.length > 0) {
      const values = rows.join(',\n')
      const sql = `INSERT INTO history (_id, time, value) VALUES ${values};`
      console.log(sql)
      //. add try catch block - ignore error? or just print it?
      await this.db.query(sql)
    }
  }
}
