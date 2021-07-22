import * as libapp from './libapp'

// traverse a tree of nodes, adding nodes and edges to arrays
//. refactor, add comments
export function traverse(
  node,
  nodes,
  edges,
  parentTag = '',
  parentKey = '',
  parents = []
) {
  if (libapp.isObject(node)) {
    // // assign random key to each node, use to define edges?
    // const _key = crypto.randomBytes(8).toString('hex')
    // let obj = { tag: parentTag, _key, parents }
    let obj = { tag: parentTag, parents }
    // iterate over key-value pairs
    const keys = Object.keys(node)
    for (const key of keys) {
      const value = node[key]
      if (key === '_declaration') {
        // ignore, eg { _attributes: { version: '1.0', encoding: 'UTF-8' }
      } else if (key === '_instruction') {
        // ignore, eg { 'xml-stylesheet': 'type="text/xsl" href="/styles/Devices.xsl"' }
      } else if (key === '_attributes') {
        obj = { ...obj, ...value, parents }
      } else if (key === '_text') {
        obj = { ...obj, value, parents }
      } else if (key === 'Agent') {
        //. ignore Agent info for now
      } else {
        const newparents = [...parents, obj] // push obj onto parents path list
        // traverse(value, nodes, edges, key, _key, newparents)
        traverse(value, nodes, edges, key, '', newparents)
      }
    }
    // get prop, eg 'DataItem(event,availability)'
    obj.prop = obj.parents.slice(4).map(getStep).join('/') + '/' + getStep(obj)
    // ditch leading '/' and double '//'
    if (obj.prop.startsWith('/')) obj.prop = obj.prop.slice(1)
    obj.prop = obj.prop.replaceAll('//', '/')
    // get device, eg 'Device(a234)'
    obj.device = getStep(obj.parents[3])
    // obj.path = obj.device + '/' + obj.prop
    delete obj.parents
    nodes.push(obj)
    // // add edge
    // if (parentKey) {
    //   edges.push({ _from: parentKey, _to: _key })
    // }
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

// get path step string for the given object.
// eg if it has tag='DataItem', get params like it's a fn,
// eg return 'DataItem(event,asset_changed,discrete=true)'
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
