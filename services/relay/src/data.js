// data
// wraps agent data returned from probe, current, and sample endpoints

// Data stores a js object of data - probe or observations.
// extended by dataProbe and dataObservations.
export class Data {
  type = null // will be probe|current|sample

  constructor() {
    this.jsTree = null
    this.errors = null
    this.header = null
    this.instanceId = null
  }

  // read xml from endpoint, convert to js, store in .js,
  // and parse out .errors, .header, .instanceId, .sequence info from it.
  // note: subclass is responsible for parsing the .js and converting it to
  // dataitem elements etc.
  async read(endpoint, from, count) {
    // console.log(`Relay - read ${endpoint.baseUrl}, ${from}, ${count}`) // too verbose

    this.jsTree = await endpoint.fetchJsTree(this.type, from, count) // see endpoint.js

    // handle errors
    if (this.jsTree.MTConnectError) {
      console.log(`Relay error tried to read from ${from} with count ${count}.`)
      // console.log(this.jsTree)
      // throw new Error('MTConnectError - see logs for details') // this stops the relay service
      // could parse the xml error messages, but simplest to just return false and
      // let the caller bump up the bandwidth.
      // xml error messages include:
      //   'count' must be less than or equal to 32 - prevent with count<=bufferSize
      //   'from' must be greater than 647331 - respond with from=<that number+1 or more>, or better - bump back to the 'current' read loop
      //   'from' must be less than 809 - how does this happen? when agent gets reset?
      // this.errors = this.jsTree.MTConnectError.Errors.map(e => e.Error.errorCode) // fails if only one error
      // let errors = this.jsTree.MTConnectError.Errors
      // if (!Array.isArray(errors)) errors = [errors]
      return false // failed read - will bump from 'sample' back to 'current' loop
    }

    // get Header attributes for probe, current, or sample xmls.
    // includes { instanceId, firstSequence, nextSequence, lastSequence, bufferSize, ... }
    this.header = this.jsTree.MTConnectDevices
      ? this.jsTree.MTConnectDevices.Header._
      : this.jsTree.MTConnectStreams.Header._

    // get .instanceId
    this.instanceId = this.header.instanceId

    // get .sequence info for current/sample endpoints
    if (this.jsTree.MTConnectStreams) {
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
