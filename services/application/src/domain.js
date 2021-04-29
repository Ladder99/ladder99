// recurse down a tree of nodes, calling callback on each one
export function traverse(node, callback) {
  if (Array.isArray(node)) {
    node.forEach(subnode => traverse(subnode, callback))
  } else if (node !== null && typeof node === 'object') {
    Object.values(node).forEach(value => traverse(value, callback))
  } else {
    callback(node)
  }
}
