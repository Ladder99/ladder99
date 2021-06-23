// data
// wraps agent data returned from probe, current, and sample endpoints

//. switch back to using xml, or convert it to json/xmltree structure

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

  // // traverse the json tree and return all elements and relations
  // getElements() {
  //   const elements = []
  //   traverse(this.json, els => {
  //     elements.push(...els)
  //   })
  //   return elements
  // }

  // // traverse the json tree and return all data items
  // getDataItems() {
  //   const allDataItems = []
  //   libapp.traverse(this.json, dataItems => {
  //     allDataItems.push(...dataItems)
  //   })
  //   return allDataItems
  // }

  // traverse tree and add nodes and edges to the probe graph structure.
  // callback(key, obj, node, parent)
  getProbeGraph() {
    const graph = new Graph()
    const callbacks = {
      MTConnectDevices: (key, obj, node, parent) => {
        // obj is an object with Header and Devices keys - will recurse
        const n = graph.nodes.add({ elementType: key }) // add root object with no attribs or edges
      },
      Header: (key, obj, node, parent) => {
        // obj is a leaf object with instanceId, version etc
        const n = graph.nodes.add({ elementType: key, ...obj })
        // const edge = { from: parent, to: n }
        // graph.edges.add(edge)
      },
      Device: (key, obj, node, parent) => {
        const { id, name, uuid, Description } = obj
        const n = graph.nodes.add({
          elementType: key,
          id,
          name,
          uuid,
          description: Description,
        })
      },
      DataItem: (key, obj, node, parent) => {
        // obj is a leaf, though possibly with Filter subitems
        // const { category, type, subType, id, name } = obj
        const n = graph.nodes.add({ elementType: key, ...obj })
      },
    }
    traverse(this.json, callbacks)
    return graph
  }
}

//

// recurse down a tree of nodes, calling callback on each one.
// callbacks take an array of nodes and array of edges.
function traverse(node, callbacks, parent = null) {
  if (libapp.isObject(node)) {
    const entries = Object.entries(node)
    entries.forEach(([key, obj]) => {
      const callback = callbacks[key]
      if (callback) callback(key, obj, node, parent)
      traverse(obj, callbacks, node) // recurse
    })
  } else if (Array.isArray(node)) {
    // if array, recurse down each item
    node.forEach(subnode => traverse(subnode, callbacks, node)) // recurse
  } else {
    // if node is atomic value (string, number) or null/undefined do nothing
    // (ie no recursion)
  }
}
