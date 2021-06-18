export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// recurse down a tree of nodes, calling callback on each one.
// callback takes array of elements.
export function traverse(node, callback) {
  const isObject = node !== null && typeof node === 'object'
  if (isObject) {
    // if object, call callback for dataitems, recurse for others
    Object.entries(node).forEach(([key, values]) => {
      if (key === 'Samples' || key === 'Events' || key === 'Condition') {
        values.forEach(value => {
          const dataItems = getDataItems(key, value)
          callback(dataItems) // pass dataitems to callback
        })
      } else if (key === 'DataItems') {
        const dataItems = values
        callback(dataItems)
      } else {
        traverse(values, callback) // recurse
      }
    })
  } else if (Array.isArray(node)) {
    // if array, recurse down each item
    node.forEach(subnode => traverse(subnode, callback)) // recurse
  } else if (node === null || node === undefined) {
    // if null do nothing
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
