// data
// wraps agent data returned from probe, current, and sample endpoints

import * as libapp from './libapp.js'
import { Graph } from './graph.js'

export class Data {
  constructor(json) {
    this.json = json
  }

  // type is 'probe', 'current', 'sample'
  static await getProbe(endpoint) {
    const json = await endpoint.fetchJson('probe')
    const data = new Data(json)
    data.parse()
    return data
  }

  parse() {
    // eg <Errors><Error errorCode="OUT_OF_RANGE">'from' must be greater than 647331</Error></Errors>
    if (this.json.MTConnectError) {
      console.log(this.json)
      return this.json.MTConnectError.Errors
    // const codes = this.json.MTConnectError.Errors.map(e => e.Error.errorCode)
  }

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
    if (this.json.MTConnectDevices) {
      return this.json.MTConnectDevices.Header
    }
    return this.json.MTConnectStreams.Header
  }

  getInstanceId() {
    return this.getHeader().instanceId
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

  // traverse json tree and add nodes and edges to a graph structure.
  getProbeGraph() {
    const graph = new Graph()
    // define callbacks for different object types encountered
    const callbacks = {
      MTConnectDevices: (key, obj, node, parent) => {
        // obj has Header and Devices keys - will recurse
        graph.nodes.add({ elementType: key }) // add root object with no attribs or edges
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
        // obj is a leaf with { id, name, type, ... }, possibly Filter, Constraint subitems
        const n = graph.nodes.add({ elementType: key, ...obj })
      },
      // Configuration: Other,
      // Specification: Other,
    }
    // function Other(key, obj, node, parent) {
    //   console.log('OTHER', key)
    // }
    traverse(this.json, callbacks) // recurse through probe structure, add to graph
    return graph
  }

  getCurrentData() {
    let deviceName = null
    let group = null
    const dataitems = []
    const callbacks = {
      DeviceStream: (key, obj, node, parent) => {
        deviceName = obj.name
      },
      Samples: key => (group = key),
      Events: key => (group = key),
      Condition: key => (group = key),
      VariableDataSet: () => {}, //. skip these for now
      Other: (key, obj, node, parent) => {
        if (obj.dataItemId && !obj.dataItemId.startsWith('_')) {
          dataitems.push({ elementType: key, group, ...obj })
        }
      },
    }
    traverse(this.json, callbacks)
    return dataitems
  }
}

//

// recurse down a tree of nodes, calling callback on each one.
// callbacks take an array of nodes and array of edges.
function traverse(node, callbacks, parent = null) {
  if (libapp.isObject(node)) {
    const entries = Object.entries(node)
    entries.forEach(([key, obj]) => {
      const callback = callbacks[key] || callbacks.Other
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
