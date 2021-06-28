// data
// wraps agent data returned from probe, current, and sample endpoints

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
