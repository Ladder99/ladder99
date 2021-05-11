// recurse down a tree of nodes, calling callback on each one.
// callback takes array of dataItems.
export function traverse(node, callback) {
  if (Array.isArray(node)) {
    node.forEach(subnode => traverse(subnode, callback))
  } else if (node !== null && typeof node === 'object') {
    Object.entries(node).forEach(([key, value]) => {
      if (key === 'Samples' || key === 'Events' || key === 'Condition') {
        value.forEach(value => {
          const dataItems = getDataItems(key, value)
          callback(dataItems)
        })
      } else {
        traverse(value, callback)
      }
    })
  } else if (node === null || node === undefined) {
    return
  } else {
    // callback(node)
  }
}

function getDataItems(group, datanode) {
  const types = Object.keys(datanode)
  const dataItems = types.map(type => {
    const dataItem = { group, type, ...datanode[type] }
    return dataItem
  })
  return dataItems
}
