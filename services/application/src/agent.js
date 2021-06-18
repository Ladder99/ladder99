export class Agent {
  constructor(endpoint) {
    this.endpoint = endpoint // base url
    this.from = null
    this.idMap = {} // map from element id to integer _id for db tables
    //. these will be dynamic - optimize on the fly
    this.fetchInterval = fetchInterval
    this.fetchCount = fetchCount
    this.instanceId = null
  }

  // start a 'thread' to handle data from the given base agent url
  async run(db) {
    // get device structures and write to db
    probe: do {
      const json = await this.fetchAgentData('probe')
      if (await noAgentData(json)) break probe
      this.instanceId = getInstanceId(json)
      await this.handleProbe(db, json)

      // get last known values of all dataitems, write to db
      current: do {
        const json = await this.fetchAgentData('current')
        if (await noAgentData(json)) break current
        if (this.instanceIdChanged(json)) break probe
        // await this.handleCurrent(db, json)

        // get sequence of dataitem values, write to db
        sample: do {
          // const json = await this.fetchAgentSample()
          // if (await noAgentData(json)) break sample
          // if (this.instanceIdChanged(json)) break probe
          // await this.handleSample(db, json)
          await sleep(fetchInterval)
        } while (true)
      } while (true)
    } while (true)
  }

  instanceIdChanged(json) {
    const header = json.MTConnectDevices.Header
    if (header.instanceId !== this.instanceId) {
      console.log(`InstanceId changed - falling back to probe...`)
      return true
    }
    return false
  }

  // fetch data - type is 'probe' or 'current'
  //. move to api.js ?
  async fetchAgentData(type) {
    const url = getUrl(this.endpoint, type)
    const json = await fetchJsonData(url)
    return json
  }

  async handleProbe(db, json) {
    // const graph = getGraph(json)
    // await writeGraphStructure(db, graph)
  }

  async handleCurrent(db, json) {
    // // get sequence info from header
    // const { firstSequence, nextSequence, lastSequence } =
    //   json.MTConnectStreams.Header
    // this.from = nextSequence
    // const dataItems = getDataItems(json)
    // await writeDataItems(db, dataItems)
    // await writeGraphValues(db, graph)
  }

  async getSample() {
    this.from = null
    this.count = this.fetchCount
    let json
    do {
      const url = getUrl(this.endpoint, 'sample', this.from, this.count)
      json = await fetchAgentData(url)
      // check for errors
      // eg <Error errorCode="OUT_OF_RANGE">'from' must be greater than 647331</Error>
      if (json.MTConnectError) {
        console.log(json)
        const codes = json.MTConnectError.Errors.map(e => e.Error.errorCode)
        if (codes.includes('OUT_OF_RANGE')) {
          // we lost some data, so reset the index and get from start of buffer
          console.log(
            `Out of range error - some data was lost. Will reset index and get as much as possible from start of buffer.`
          )
          this.from = null
          //. adjust fetch count/speed
        }
      }
    } while (json.MTConnectError)
    return json
  }

  async handleSample(db, json) {
    // get sequence info from header
    const header = json.MTConnectStreams.Header
    const { firstSequence, nextSequence, lastSequence } = header
    this.from = nextSequence

    const dataItems = getDataItems(json)
    await writeDataItems(db, dataItems)

    // //. if gap, fetch and write that also
    // const gap = false
    // if (gap) {
    //   const json = await fetchAgentData('sample', sequences.from, sequences.count)
    //   const dataItems = getDataItems(json)
    //   await writeDataItems(db, dataItems)
    // }
  }
}
