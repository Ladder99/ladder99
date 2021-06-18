export class Data {
  constructor(json) {
    this.json = json
  }

  getHeader() {
    return this.json.MTConnectDevices.Header
  }

  getInstanceId() {
    const header = this.getHeader()
    let { instanceId } = header
    return instanceId
  }

  async noAgentData() {
    if (!this.json) {
      console.log(`No data available - will wait and try again...`)
      await libapp.sleep(4000)
      return true
    }
    return false
  }

  // traverse the json tree and return all elements and relations
  getElements() {
    const allElements = []
    libapp.traverse(this.json, elements => {
      allElements.push(...elements)
    })
    return allElements
  }

  // // traverse the json tree and return all data items
  // getDataItems() {
  //   const allDataItems = []
  //   libapp.traverse(this.json, dataItems => {
  //     allDataItems.push(...dataItems)
  //   })
  //   return allDataItems
  // }
}
