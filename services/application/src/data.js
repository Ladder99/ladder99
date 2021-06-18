// data
// handles data returned from probe, current, and sample endpoints

import * as libapp from './libapp.js'
import { Graph } from './graph.js'

export class Data {
  constructor(json) {
    this.json = json
  }

  getErrors() {
    // eg <Errors><Error errorCode="OUT_OF_RANGE">'from' must be greater than 647331</Error></Errors>
    // const codes = this.json.MTConnectError.Errors.map(e => e.Error.errorCode)
    if (this.json.MTConnectError) {
      console.log(this.json)
      return this.json.MTConnectError.Errors
    }
  }

  getHeader() {
    return this.json.MTConnectDevices.Header
  }

  getInstanceId() {
    return this.getHeader().instanceId
  }

  async unavailable() {
    if (!this.json) {
      console.log(`No data available - will wait and try again...`)
      await libapp.sleep(4000)
      return true
    }
    return false
  }

  instanceIdChanged(instanceId) {
    if (this.getInstanceId() !== instanceId) {
      console.log(`InstanceId changed - falling back to probe...`)
      return true
    }
    return false
  }

  // traverse the json tree and return all elements and relations
  getElements() {
    const elements = []
    libapp.traverse(this.json, els => {
      elements.push(...els)
    })
    return elements
  }

  // // traverse the json tree and return all data items
  // getDataItems() {
  //   const allDataItems = []
  //   libapp.traverse(this.json, dataItems => {
  //     allDataItems.push(...dataItems)
  //   })
  //   return allDataItems
  // }

  getGraph() {
    const graph = new Graph()
    libapp.traverse(this.json, (ns, es) => {
      graph.addNodes(ns)
      if (es) graph.addEdges(es)
    })
    return graph
  }
}
