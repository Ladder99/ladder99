// data
// wraps/handles data returned from probe, current, and sample endpoints

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

  // traverse the json tree and return all elements and relations
  getElements() {
    const elements = []
    traverse(this.json, els => {
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

  // traverse json tree and add nodes and edges to a graph structure
  getGraph() {
    const graph = new Graph()
    traverse(this.json, (nodes, edges = []) => {
      for (const node of nodes) graph.nodes.add(node)
      for (const edge of edges) graph.edges.add(edge)
    })
    return graph
  }
}

// recurse down a tree of nodes, calling callback on each one.
// callback takes array of nodes and array of edges.
function traverse(node, callback, parent = null) {
  if (libapp.isObject(node)) {
    // if object, call callback for dataitems, recurse for others
    const keyvalues = Object.entries(node)
    keyvalues.forEach(([key, values]) => {
      if (key === 'MTConnectDevices') {
        // values is an object with Header and Devices keys - recurse
        callback([{ id: key }]) // add root object to db, no edges
        traverse(values, callback, node) // recurse
      } else if (key === 'Header') {
        // values is a leaf object with instanceId, version etc
        //. what do with this obj? how write to db?
        //. how return edges? just parent?
        // const items = [values]
        const items = [{ id: key, ...values }]
        callback(items)
      } else if (key === 'Devices') {
        // values is an array with one object per device - { Agent } or { Device }
        traverse(values, callback, node) // recurse
        // } else if (key === 'DataItems') {
        //   const dataItems = values
        //   callback(dataItems)
        // } else if (key === 'Samples' || key === 'Events' || key === 'Condition') {
        //   values.forEach(value => {
        //     const dataItems = getDataItems(key, value)
        //     callback(dataItems) // pass dataitems to callback
        //   })
      } else {
        traverse(values, callback, node) // recurse
      }
    })
  } else if (Array.isArray(node)) {
    // if array, recurse down each item
    node.forEach(subnode => traverse(subnode, callback, node)) // recurse
  } else if (node === null || node === undefined) {
    // if null/undef do nothing
  } else {
    // if value do nothing
  }

  // given a group (ie 'Samples', 'Events', 'Condition')
  // and datanode (the dataitem without its group and type info),
  // return a list of dataItems (objects with group and type info).
  function getDataItems(group, datanode) {
    // add group and type to the datanode
    const dataItems = Object.entries(datanode).map(([type, value]) => {
      return { group, type, ...value }
    })
    return dataItems
  }
}
