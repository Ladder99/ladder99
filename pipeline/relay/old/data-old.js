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


// recurse down a tree of nodes, calling callback on each one.
// callbacks take an array of nodes and array of edges.
function traverse(node, callbacks, parent = null) {
  if (lib.isObject(node)) {
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
