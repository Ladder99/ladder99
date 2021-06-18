export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function isObject(node) {
  return node !== null && typeof node === 'object'
}

// recurse down a tree of nodes, calling callback on each one.
// callback takes array of nodes and array of edges.
export function traverse(node, callback, parent = null) {
  if (isObject(node)) {
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

export function print(...obj) {
  console.dir(...obj, { depth: null })
}
