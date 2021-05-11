// logic for mtconnect application

// recurse down a tree of nodes, calling callback on each one.
// callback takes array of dataItems.
export function traverse(node, callback) {
  if (Array.isArray(node)) {
    // if array, recurse down each item
    node.forEach(subnode => traverse(subnode, callback)) // recurse
  } else if (node !== null && typeof node === 'object') {
    // if object, call callback for dataitems, recurse for others
    Object.entries(node).forEach(([key, value]) => {
      if (key === 'Samples' || key === 'Events' || key === 'Condition') {
        value.forEach(value => {
          const dataItems = getDataItems(key, value)
          callback(dataItems)
        })
      } else {
        traverse(value, callback) // recurse
      }
    })
  } else if (node === null || node === undefined) {
    // if null do nothing
    return
  } else {
    // if value do nothing
    // callback(node)
  }
}

// given a group (ie 'Samples', 'Events', 'Condition')
// and datanode ()
// return a list of dataItems
function getDataItems(group, datanode) {
  const types = Object.keys(datanode)
  const dataItems = types.map(type => {
    // add group and type to the datanode
    const dataItem = { group, type, ...datanode[type] }
    return dataItem
  })
  // const dataItems = Object.entries(datanode).map((key, value) => {
  //   return { group, type: key, ...value}
  // })
  return dataItems
}
