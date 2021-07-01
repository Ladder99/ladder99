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
        // ignore xml declaration
      } else if (key === '_attributes') {
        obj = { ...obj, ...value, parents }
      } else if (key === '_text') {
        obj = { ...obj, value, parents }
      } else if (key === 'Agent') {
        // ignore Agent info - ok?
      } else {
        const newparents = [...parents, obj] // push obj onto parents path list
        traverse(value, nodes, edges, key, _key, newparents)
      }
    }
    obj.prop = obj.parents.slice(4).map(getStep).join('/') + '/' + getStep(obj)
    obj.device = getStep(obj.parents[3])
    if (obj.prop.startsWith('/')) obj.prop = obj.prop.slice(1)
    obj.prop = obj.prop.replaceAll('//', '/')
    // obj.path = obj.device + '/' + obj.prop
    delete obj.parents
    nodes.push(obj)
    if (parentKey) {
      edges.push({ _from: parentKey, _to: _key })
    }
  } else if (Array.isArray(node)) {
    for (const el of node) {
      traverse(el, nodes, edges, parentTag, parentKey, parents)
    }
  } else {
    console.log('>>what is this?', { node })
  }
}

// ignore these element types - don't add much info to the path
const ignoreTags = new Set(
  'AssetCounts,Devices,DataItems,Components,Filters,Specifications'.split(',')
)

// ignore these dataitem attributes - not necessary to identify an element,
// or are redundant.
const ignoreAttributes = new Set(
  'category,type,subType,_key,tag,parents,id,units,nativeUnits'.split(',')
)

function getStep(obj) {
  let params = []
  if (!obj) return ''
  if (ignoreTags.has(obj.tag)) return ''
  switch (obj.tag) {
    case 'Device':
      params = [obj.uuid] // standard says name may be optional in future versions, so use uuid
      break
    case 'DataItem':
      params = [obj.category, obj.type]
      if (obj.subType) params.push(obj.subType)
      for (const key of Object.keys(obj)) {
        if (!ignoreAttributes.has(key)) {
          params.push(key + '=' + obj[key])
        }
      }
      break
    case 'Specification':
    case 'Composition':
      params = [obj.type]
      if (obj.subType) params.push(obj.subType)
      break
    default:
      // don't give param if it's like "Systems(systems)" - indicates just one in a document
      if ((obj.name || '').toLowerCase() !== (obj.tag || '').toLowerCase()) {
        // params = [obj.id] //. or obj.name ?? sometimes one is nicer than the other
        params = [obj.name || obj.id || '']
      }
      break
  }
  const paramsStr =
    params.length > 0 && params[0].length > 0
      ? '(' + params.map(param => param.toLowerCase()).join(',') + ')'
      : ''
  const step = `${obj.tag}${paramsStr}`
  return step
}
