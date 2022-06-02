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
    console.log(`Relay - read ${endpoint.baseUrl}, ${from}, ${count}`)

    this.json = await endpoint.fetchJson(this.type, from, count)

    // parse .json
    // console.log(`Relay - parse header...`)

    // get .errors
    //. handle errors as needed
    if (this.json.MTConnectError) {
      console.log(
        `Relay error - tried to read from ${from} with count ${count}.`
      )
      console.log(this.json)
      // throw new Error('MTConnectError - see logs for details') // this stops the relay service
      // xml error messages include:
      //   'count' must be less than or equal to 32 - prevent with count<=bufferSize
      //   'from' must be greater than 647331 - respond with from=<that number+1 or more>, or better - bump back to the 'current' read loop
      //   'from' must be less than 809 - how does this happen? when agent gets reset?
      // this.errors = this.json.MTConnectError.Errors.map(e => e.Error.errorCode) // fails if only one error
      let errors = this.json.MTConnectError.Errors
      if (!Array.isArray(errors)) errors = [errors]
      for (let error of errors) {
        const str = JSON.stringify(error)
        if (str.includes('greater than')) {
        }
      }
      return false // failed read - will bump from 'sample' back to 'current' loop
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
    return true // handled read okay
  }
}
