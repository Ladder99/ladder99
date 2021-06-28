import crypto from 'crypto' // node lib

export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function isObject(node) {
  return node !== null && typeof node === 'object' && !Array.isArray(node)
}

export function print(...obj) {
  console.dir(...obj, { depth: null })
}

// https://stackoverflow.com/questions/22266826/how-can-i-do-a-shallow-comparison-of-the-properties-of-two-objects-with-javascri
export function shallowCompare(obj1, obj2) {
  return (
    Object.keys(obj1).length === Object.keys(obj2).length &&
    Object.keys(obj1).every(
      key => obj2.hasOwnProperty(key) && obj1[key] === obj2[key]
    )
  )
}

// traverse a tree of nodes, calling callbacks
export function traverse(
  node,
  addNode,
  addEdge,
  parentTag = 'root',
  parentKey = ''
) {
  if (isObject(node)) {
    const keys = Object.keys(node)
    // assign random key to each node, use to define edges
    const _key = crypto.randomBytes(8).toString('hex')
    let obj = { tag: parentTag, _key }
    for (const key of keys) {
      const value = node[key]
      if (key === '_declaration') {
      } else if (key === '_attributes') {
        obj = { ...obj, ...value }
      } else if (key === '_text') {
        obj = { ...obj, value }
      } else {
        traverse(value, addNode, addEdge, key, _key)
      }
    }
    addNode(obj)
    if (parentKey) {
      addEdge({ _from: parentKey, _to: _key })
    }
  } else if (Array.isArray(node)) {
    for (const el of node) {
      traverse(el, addNode, addEdge, parentTag, parentKey)
    }
  } else {
    console.log('>>what is this?', { node })
  }
}
