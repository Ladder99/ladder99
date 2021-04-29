// recurse down a tree of nodes, calling callback on each one.
// callback takes array of dataItems.
export function traverse(node, callback) {
  if (Array.isArray(node)) {
    node.forEach(subnode => traverse(subnode, callback))
  } else if (node !== null && typeof node === 'object') {
    Object.entries(node).forEach(([key, value]) => {
      if (key === 'Samples' || key === 'Events' || key === 'Condition') {
        value.forEach(value => {
          const dataItems = foo(key, value)
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

function foo(group, datanode) {
  const types = Object.keys(datanode)
  const dataItems = types.map(type => {
    const data = datanode[type]
    const id = data['@dataItemId']
    const sequence = data['@sequence']
    const timestamp = data['@timestamp']
    const value = data.Value
    const dataItem = {
      group,
      type,
      id,
      sequence,
      timestamp,
      value,
    }
    return dataItem
  })
  return dataItems
}
