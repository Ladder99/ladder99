// logic for mtconnect application

// recurse down a tree of nodes, calling callback on each one.
// callback takes array of dataItems.
export function traverse(node, callback) {
  // if array, recurse down each item
  if (Array.isArray(node)) {
    node.forEach(subnode => traverse(subnode, callback)) // recurse
  } else if (node !== null && typeof node === 'object') {
    // else if object, call callback for dataitems, recurse for others
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
  } else if (node === null || node === undefined) {
    // else if null do nothing
  } else {
    // else if value do nothing
  }
}

// given a group (ie 'Samples', 'Events', 'Condition')
// and datanode ()
// return a list of dataItems
function getDataItems(group, datanode) {
  // add group and type to the datanode
  const dataItems = Object.entries(datanode).map(([type, value]) => {
    return { group, type, ...value }
  })
  return dataItems
}
