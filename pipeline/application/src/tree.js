import * as libapp from './libapp.js'

// get flat list of nodes from given json tree
export function getElements(json) {
  const els = []
  recurse(json, els)
  return els
}

const ignore = obj => obj

const elementHandlers = {
  // eg { _attributes: { version: '1.0', encoding: 'UTF-8' }
  _declaration: ignore,

  // eg { 'xml-stylesheet': 'type="text/xsl" href="/styles/Devices.xsl"' }
  _instruction: ignore,

  Agent: ignore,
  // Resources: ignore,

  // eg { id: 'd1', name: 'M12346', uuid: 'M80104K162N' }
  _attributes: (obj, value) => ({ ...obj, ...value }),

  // eg value = 'Mill w/Smooth-G'
  _text: (obj, value) => ({ ...obj, value }),
}

// traverse a tree of elements, adding them to an array
//. refactor, add comments
//. handle parents differently - do in separate pass?
function recurse(el, els, parentTag = '', parentKey = '', parents = []) {
  // el can be an object, an array, or an atomic value
  // const elType = libapp.isObject(el) ? 'object' : Array.isArray(el) ? 'array' : 'atom'
  // switch (elType) {
  //   case 'object':
  //   case 'array':
  //   case 'atom':
  //     break
  // }

  // el is an object with keyvalue pairs
  if (libapp.isObject(el)) {
    let obj = { tag: parentTag, parents }

    // iterate over keyvalue pairs,
    // eg key='_attributes', value={ id: 'd1', name: 'M12346', uuid: 'M80104K162N' }
    for (const [key, value] of Object.entries(el)) {
      // get key-value handler
      const handler = elementHandlers[key] || ignore
      obj = handler(obj, value)
      // recurse
      const newparents = [...parents, obj] // push obj onto parents path list
      recurse(value, els, key, '', newparents)
    }

    // get prop, eg 'DataItem(event,availability)'
    if (obj.tag === 'DataItem') {
      obj.prop =
        obj.parents.slice(4).map(getPathStep).join('/') + '/' + getPathStep(obj)
      // ditch leading '/' and double '//'
      if (obj.prop.startsWith('/')) obj.prop = obj.prop.slice(1)
      obj.prop = obj.prop.replaceAll('//', '/')
      // get device, eg 'Device(a234)'
      obj.device = getPathStep(obj.parents[3])
    }
    // obj.path = obj.device + '/' + obj.prop
    delete obj.parents
    if (obj.tag === 'Device' || obj.tag === 'DataItem') els.push(obj)
  } else if (Array.isArray(el)) {
    for (const subel of el) {
      recurse(subel, els, parentTag, parentKey, parents) // recurse
    }
  } else {
    console.log('>>what is this?', { el })
  }
}

//

function iterate(el, els) {
  const pairs = Object.entries(el)
  for (const [key, value] of pairs) {
    // console.log(key, value)
  }
}

//

// ignore these element types - don't add much info to the path
const ignoreTags = new Set(
  'AssetCounts,Devices,DataItems,Components,Filters,Specifications'.split(',')
)

// ignore these DataItem attributes - not necessary to identify an element,
// or are redundant.
const ignoreAttributes = new Set(
  'category,type,subType,_key,tag,parents,id,units,nativeUnits'.split(',')
)

// get path step string for the given object.
// eg if it has tag='DataItem', get params like it's a fn,
// eg return 'DataItem(event,asset_changed,discrete=true)'
function getPathStep(obj) {
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
