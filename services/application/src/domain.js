// recurse down a tree of nodes, calling callback on each one
export function traverse(node, callback) {
  if (Array.isArray(node)) {
    node.forEach(subnode => traverse(subnode, callback))
  } else if (node !== null && typeof node === 'object') {
    // Object.values(node).forEach(value => traverse(value, callback))
    Object.entries(node).forEach(([key, value]) => {
      if (key === 'Samples' || key === 'Events' || key === 'Conditions') {
        value.forEach(value => callback(key, value))
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
