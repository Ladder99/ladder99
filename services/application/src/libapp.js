import crypto from 'crypto' // node lib for random ids

export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function isObject(node) {
  return node !== null && typeof node === 'object' && !Array.isArray(node)
}

// print a complete object tree (console.log only does to depth 2)
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

// traverse a tree of nodes, adding nodes and edges to arrays
export function traverse(
  node,
  nodes,
  edges,
  parentTag = '',
  parentKey = '',
  parents = []
) {
  if (isObject(node)) {
    const keys = Object.keys(node)
    // assign random key to each node, use to define edges?
    const _key = crypto.randomBytes(8).toString('hex')
    let obj = { tag: parentTag, _key, parents }
    for (const key of keys) {
      const value = node[key]
      if (key === '_declaration') {
      } else if (key === '_attributes') {
        obj = { ...obj, ...value, parents }
      } else if (key === '_text') {
        obj = { ...obj, value, parents }
      } else {
        const newparents = [...parents, obj]
        traverse(value, nodes, edges, key, _key, newparents)
      }
    }
    obj.path = obj.parents.map(node => node.id || node.tag).join('/')
    delete obj.parents
    nodes.push(obj)
    if (parentKey) {
      edges.push({ _from: parentKey, _to: _key })
    }
  } else if (Array.isArray(node)) {
    // const obj = { id: 'lkm' }
    const gparent = parents[parents.length - 2]
    const obj = { tag: gparent.tag }
    const newparents = [...parents, obj]
    for (const el of node) {
      traverse(el, nodes, edges, parentTag, parentKey, newparents)
    }
  } else {
    console.log('>>what is this?', { node })
  }
}
