import * as libapp from './libapp.js'

// get flat list of objects from given json tree
export function getProbeObjects(json) {
  const objs = []
  recurse(json, objs)
  return objs
}

const ignore = () => {}

const elementHandlers = {
  // handle attributes, eg { id: 'd1', name: 'M12346', uuid: 'M80104K162N' }
  _attributes: (obj, value) =>
    Object.keys(value).forEach(key => (obj[key] = value[key])),
  // handle text/value, eg value = 'Mill w/Smooth-G'
  _text: (obj, value) => (obj.value = value),
}

const appendTags = getSet('Device,DataItem') //. Description - add to Device obj?
const skipTags = getSet('Agent')

//

// traverse a tree of elements, adding them to an array
//. refactor, add comments
//. handle parents differently - do in separate pass?
function recurse(el, objs, tag = '', parents = []) {
  // el can be an object, an array, or an atomic value

  // handle object with keyvalue pairs
  if (libapp.isObject(el)) {
    // start object, which is a translation of the json element to something usable.
    // tag is eg 'DataItem', parents is list of ancestors - will be deleted before return.
    let obj = { tag, parents }

    // add obj to return list if one of certain tags (eg DataItem)
    if (appendTags.has(tag)) objs.push(obj)

    // get keyvalue pairs, skipping some tags (eg Agent)
    const pairs = Object.entries(el).filter(([key]) => !skipTags.has(key))

    // iterate over keyvalue pairs
    // eg key='_attributes', value={ id: 'd1', name: 'M12346', uuid: 'M80104K162N' }
    for (const [key, value] of pairs) {
      const handler = elementHandlers[key] || ignore // get keyvalue handler
      handler(obj, value) // adds value data to obj
      const newparents = [...parents, obj] // push obj onto parents path list
      recurse(value, objs, key, newparents) // recurse
    }

    // get device and signature for dataitems
    // eg 'Device(a234)' and 'DataItem(event,availability)'
    if (tag === 'DataItem') {
      // obj.signature = [...obj.parents.slice(4), obj]
      //   .map(getPathStep)
      //   .filter(step => !!step)
      //   .join('/')
      obj.steps = [...obj.parents.slice(4), obj].map(getPathStep)
    } else {
      obj.steps = [obj].map(getPathStep)
    }

    // get rid of the parents list
    delete obj.parents
    //
  } else if (Array.isArray(el)) {
    // handle array of subelements
    for (const subel of el) {
      recurse(subel, objs, tag, parents) // recurse
    }
  } else {
    // ignore atomic values
    // console.log('>>what is this?', { el })
  }
}

//

//

// ignore these element types - don't add much info to the path
const ignoreTags = getSet(
  // 'Adapters,AssetCounts,Devices,DataItems,Components,Filters,Specifications'
  ''
)

// ignore these DataItem attributes - not necessary to identify an element,
// or are redundant.
const ignoreAttributes = getSet(
  'category,type,subType,_key,tag,parents,id,units,nativeUnits,device,name'
)

function getSet(str) {
  return new Set(str.split(','))
}

// get path step string for the given object.
// eg if it has tag='DataItem', get params like it's a fn,
// eg return 'DataItem(event,asset_changed,discrete=true)'
function getPathStep(obj) {
  let params = []
  if (!obj) return ''
  if (ignoreTags.has(obj.tag)) return ''
  switch (obj.tag) {
    case 'Device':
    case 'Agent':
      params = [obj.uuid] // standard says name may be optional in future versions, so use uuid
      break
    case 'DataItem':
      // add primary params
      params = [obj.category, obj.type]
      if (obj.subType) params.push(obj.subType)
      // add named params
      let namedParams = []
      for (const key of Object.keys(obj)) {
        if (!ignoreAttributes.has(key)) {
          namedParams.push(key + '=' + obj[key])
        }
      }
      namedParams.sort()
      for (const namedParam of namedParams) {
        params.push(namedParam)
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

//. put this in a different file? dataObservations.js?

// get flat list of objects from given json tree
export function getObservationObjects(json) {
  const objs = []
  recurseObservations(json, objs)
  return objs
}

const appendTags2 = getSet('Angle')
const skipTags2 = getSet('')

// traverse a tree of elements, adding them to an array
//. refactor, add comments
//. handle parents differently - do in separate pass?
function recurseObservations(el, objs, tag = '', parents = []) {
  // el can be an object, an array, or an atomic value

  // handle object with keyvalue pairs
  if (libapp.isObject(el)) {
    // start object, which is a translation of the json element to something usable.
    // tag is eg 'DataItem', parents is list of ancestors - will be deleted before return.
    let obj = { tag, parents }

    // add obj to return list if one of certain tags (eg DataItem)
    // if (appendTags2.has(tag)) objs.push(obj)

    // get keyvalue pairs, skipping unwanted tags
    const pairs = Object.entries(el).filter(([key]) => !skipTags2.has(key))

    // iterate over keyvalue pairs
    // eg key='_attributes', value={ id: 'd1', name: 'M12346', uuid: 'M80104K162N' }
    for (const [key, value] of pairs) {
      const handler = elementHandlers[key] || ignore // get keyvalue handler
      handler(obj, value) // adds value data to obj
      const newparents = [...parents, obj] // push obj onto parents path list
      recurseObservations(value, objs, key, newparents) // recurse
    }

    // // get device and signature for dataitems
    // // eg 'Device(a234)' and 'DataItem(event,availability)'
    // if (tag === 'DataItem') {
    //   obj.device = getPathStep(obj.parents[3])
    //   obj.signature = [...obj.parents.slice(4), obj]
    //     .map(getPathStep)
    //     .filter(step => !!step)
    //     .join('/')
    // }

    if (obj.dataItemId) objs.push(obj)

    // get rid of the parents list
    delete obj.parents
    //
  } else if (Array.isArray(el)) {
    // handle array of subelements
    for (const subel of el) {
      recurseObservations(subel, objs, tag, parents) // recurse
    }
  } else {
    // ignore atomic values
    // console.log('>>what is this?', { el })
  }
}
