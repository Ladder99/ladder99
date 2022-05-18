// data
// wraps agent data returned from probe, current, and sample endpoints

// Data stores a json object of data - probe or observations.
// extended by dataProbe and dataObservations.
export class Data {
  type = null // will be probe|current|sample

  constructor() {
    this.json = null
    this.errors = null
    this.header = null
    this.instanceId = null
  }

  // read xml from endpoint, convert to json, store in .json,
  // and parse out .errors, .header, .instanceId, .sequence info from it.
  // note: subclass is responsible for parsing the .json and converting it to
  // dataitem elements etc.
  async read(endpoint, from, count) {
    console.log(`Read ${endpoint.baseUrl}, ${from}, ${count}`)

    this.json = await endpoint.fetchJson(this.type, from, count)

    // parse .json
    console.log(`Parse header...`)

    // get .errors
    //. handle errors as needed
    // eg <Errors><Error errorCode="OUT_OF_RANGE">'from' must be greater than 647331</Error></Errors>
    // if (codes.includes('OUT_OF_RANGE')) {
    //   // we lost some data, so reset the index and get from start of buffer
    //   console.log(
    //     `Out of range error - some data was lost. Will reset index and get as much as possible from start of buffer.`
    //   )
    //   this.from = null
    //   //. adjust fetch count/speed
    // }
    if (this.json.MTConnectError) {
      // this.errors = this.json.MTConnectError.Errors.map(e => e.Error.errorCode) // fails if only one error
      // let errors = this.json.MTConnectError.Errors
      // if (!Array.isArray(errors)) errors = [errors]
      // 'from' must be greater than 647331 - prevent with firstSequence
      // 'count' must be less than or equal to 32 - prevent with bufferSize
      console.log(this.json)
      console.log(`Tried to read from ${from} with count ${count}.`)
      throw new Error('MTConnectError - see logs for details')
    }

    // get .header for probe, current, or sample xmls
    this.header = this.json.MTConnectDevices
      ? this.json.MTConnectDevices.Header._attributes
      : this.json.MTConnectStreams.Header._attributes
    // console.log('header', this.header)

    // get .instanceId
    this.instanceId = this.header.instanceId

    // get .sequence info for current/sample endpoints
    if (this.json.MTConnectStreams) {
      this.sequence = {
        first: this.header.firstSequence,
        next: this.header.nextSequence,
        last: this.header.lastSequence,
        size: this.header.bufferSize,
      }
    }
  }
}
