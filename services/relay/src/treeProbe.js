// companion functions for dataProbe.js

import * as lib from './common/lib.js'

//. will want to keep track of attributes tacked onto the path -
// and/or specify them all in advance so they're in a known order
//. what else do we need?
//. or better - specify the main ones in order, then anything else goes in alpha order
const attributes = 'coordinateSystem,statistic'.split(',')

// -------------------------------------------

// get flat list of nodes from given tree by recursing through probe structure.
// eg
//   tree = { MTConnectDevices: { Header, Devices: { Agent, Device } } }
//   with Device = { _attributes, Description, DataItems, Components: { Axes, Controller, Systems }}
//   and DataItems = { DataItem: [ { _attributes: { id:'avail', type, category }}, ...]}
//   where _attributes is an object with the attributes and values
// gives something like [{
//   tag: 'DataItem',
//   device: 'abcd-1234'
//   path: 'availability',
//   fullpath: 'device(abcd-1234)/availability',
//   id: 'avail',
//   gid: 'abcd-1234#avail',
//   type: 'AVAILABILITY',
//   category: 'EVENT',
// }, ...]
export function getNodes(tree, setup, agent) {
  const translations = setup.translations || {} // dict of gid->path step
  let list = getList(tree) // flatten the tree
  addAgent(list, agent) // add agentAlias from setup to each element
  addDevice(list) // add deviceId to each element
  // addGid(list) // gid is device uuid + '#' + element id
  addFid(list) // fid is the full id = agentAlias[/deviceId[/dataitemId]]
  addStep(list, translations)
  const index = getIndex(list)
  resolveReferences(list, index) // resolve steps like '${Cmotor}' to 'motor'
  addFullPath(list, agent)
  list.forEach(el => delete el.parent) // remove parent attributes
  console.log(list)
  process.exit(0)
  addPath(list)
  cleanup(list)
  list = filterList(list) // only include nodes that have id
  return list
}

function addAgent(list, agent) {
  for (let el of list) {
    if (el.id) el.agentAlias = agent.id
  }
}

// add device/agent uuid to elements
function addDevice(list) {
  let deviceId
  for (let el of list) {
    // agents and devices have uuids that identify items beneath them in tree
    if (el.tag === 'Agent' || el.tag === 'Device') {
      deviceId = el.id
    }
    // assign each element its ancestor's uuid in the device attribute.
    // but only if the element has an id - don't need/want it otherwise.
    if (deviceId && el.id) el.deviceId = deviceId
  }
}

// add full id to elements
function addFid(list) {
  for (let el of list) {
    const fid =
      (el.agentAlias ? el.agentAlias : '') +
      (el.deviceId ? '/' + el.deviceId : '') +
      // (el.tag === 'DataItem' ? '/' + el.id : '')
      (el.id ? '/' + el.id : '')
    if (fid) el.fid = fid
  }
}

//

// get flat list from a tree of elements
// eg an element of the list could be
// {
//   parent: { parent: [Object] },
//   tag: 'DataItem',
//   category: 'SAMPLE',
//   id: 'm-temp',
//   name: 'temperature',
//   nativeUnits: 'CELSIUS',
//   type: 'TEMPERATURE',
//   units: 'CELSIUS'
// }
function getList(tree) {
  let list = []
  flatten(tree, list)
  return list
}

// cleanup the flat list of nodes
// currently - remove parent, step, etc
function cleanup(list) {
  for (let el of list) {
    delete el.parent
    delete el.step
    if (!el.id) {
      delete el.path
      delete el.fullpath
    }
  }
}

// add a full path to each element,
// which includes the parents
function addFullPath(list, agent) {
  for (let el of list) {
    if (!el.parent) continue
    if (el.parent.fullpath) {
      el.fullpath = el.parent.fullpath + (el.step ? '/' + el.step : '')
    } else {
      el.fullpath = agent.id + (el.step ? '/' + el.step : '')
    }
  }
}

function addPath(list) {
  for (let el of list) {
    if (!el.parent) continue
    if (el.tag === 'Device' || el.tag === 'Agent') continue
    if (el.parent.path) {
      el.path = el.parent.path + (el.step ? '/' + el.step : '')
    } else {
      el.path = el.step || ''
    }
  }
}

function addStep(list, translations) {
  for (let el of list) {
    const step = getStep(el, translations)
    if (step) el.step = step
  }
}

// filter the list of elements down to those needed for the relay and db
function filterList(list) {
  return list.filter(el => !!el.id) // just need those with an id
}

// get an index for fid (eg 'main/m/m1-avail') to element.
//. call it indexFidToNode? fidToNode? call this getFidToNode?
function getIndex(list) {
  const index = {}
  for (let el of list) {
    if (el.fid) {
      index[el.fid] = el
    }
  }
  return index
}

// // add gid (device uuid + element id) to all elements -
// // it should be unique across all documents.
// function addGid(list) {
//   for (let el of list) {
//     if (el.id) {
//       el.gid = (el.device || el.uuid) + '#' + el.id
//     }
//   }
// }

// resolve references in path steps.
// eg if step contains '${Cmotor}', get element id='Cmotor',
// prepend the device uuid, eg 'abcd-123#Cmotor',
// look that element up in the gid index, and replace the reference with that
// element's type and optional name, eg 'motor'.
//. handle 'type[name]' and 'type' differently? eg with ${foo}.typename or .type?
function resolveReferences(list, index) {
  for (let el of list) {
    if (el.step && el.step.includes('$')) {
      const regexp = /[$][{](.*)[}]/g // finds '${id}' and extracts id
      for (let match of el.step.matchAll(regexp)) {
        const id = match[1] // eg 'foo'
        // const gid = el.device + '#' + id // ie 'device(uuid)#id'
        const fid = el.agentAlias + '/' + el.deviceId + '/' + id
        const node = index[fid] // get the node object
        if (node) {
          // replace original with new step string, eg 'foo-${id}' -> 'foo-motor[a]'
          const name = el.name ? `[${el.name}]` : ''
          const original = match[0] // eg '${id}'
          const replacement = node.type.toLowerCase() + name // eg 'motor[a]'
          el.step = el.step.replaceAll(original, replacement)
        }
      }
    }
  }
}

// -------------------------------------------------------------

// traverse an xml tree, add tags, path string, create flat list.
// part - can be an object, an array, or an atomic value, eg
//   { MTConnectDevices: { Header, Devices: { Agent, Device }}}
// list - a growing flat list of objects we're interested in from the parts,
//   eg [{ tag: 'DataItem', path, category, id, name }, ...]
// parents - a list of parent elements that grows as we recurse through the tree.
// tag - the key for the current element, eg 'DataItem'.
function flatten(part, list, parent, tag = 'Document') {
  //
  if (lib.isObject(part)) {
    //
    // start a new object, where we will write the element attributes,
    // WITHOUT the subelements (eg write Device without the DataItems subelement).
    let obj = {}

    // save link to parent obj
    obj.parent = parent

    // add object to the flat list
    obj.tag = tag
    list.push(obj)

    // add all attributes in the value object to this object.
    // note: '_' is used by the xml processing library to store element attributes.
    if (part['_']) {
      Object.assign(obj, part['_'])
      delete part['_'] // remove attributes so don't get recursed down
    }

    // add text contents as obj.value
    // note: '$' is used by the xml processing library to store element contents.
    if (part['$']) {
      obj.value = part['$']
      delete part['$']
    }

    // recurse over part's keyvalues.
    // value will be an object or array - eg if key is 'Devices',
    // it'll have a single object or an array of objects.
    for (const [key, value] of Object.entries(part)) {
      flatten(value, list, obj, key) // recurse
    }

    // if obj has no id and we're not at root object, add it as a child of its parent.
    // this lets us store things like Description, Filters, etc as part of their parent.
    if (!obj.id && parent) {
      const tagid = lib.getCamelCase(obj.tag) // eg 'filters'
      delete obj.tag // eg 'Filters'
      // but only add object if it has some data in it
      // (obj will always have .parent, so ignore 1)
      if (Object.keys(obj).length > 1) {
        // if there's already an object there, add to an array
        if (parent[tagid]) {
          // if it's already an array, just add the object
          if (Array.isArray(parent[tagid])) {
            parent[tagid].push(obj)
          } else {
            // otherwise start a new array
            parent[tagid] = [parent[tagid], obj]
          }
        } else {
          parent[tagid] = obj
        }
      }
    }
    //
  } else if (Array.isArray(part)) {
    for (const element of part) {
      flatten(element, list, parent, tag) // recurse
    }
  }
}

// ----------------------------------------------------------

// get path step for the given object
// eg
//   for a Device element, return 'device(abcd-123...)'
//   for a DataItem element, return 'position-actual'
function getStep(obj, translations) {
  //
  // handle translations, eg 'abcd-123#a' -> 'axes' (instead of 'base')
  const translation = translations[obj.gid]
  if (translation) return translation

  // call the step handler for the given tag, or a fallback handler
  const stepHandler = stepHandlers[obj.tag] || stepHandlers.other
  const step = stepHandler(obj)
  return step
}

const stepHandlers = {
  // MTConnectDevices: () => 'mtconnect',
  // Agent: obj => `agent(${obj.uuid})`,
  Agent: obj => obj.agentAlias,
  // Device: obj => `device(${obj.uuid})`,
  Device: obj => obj.deviceId,
  Linear: obj => `linear[${obj.name.toLowerCase()}]`,
  Rotary: obj => `rotary[${obj.name.toLowerCase()}]`,
  DataItem: getDataItemStep,
  ref: obj => '${' + obj.id + '}', // eg '${m1-foo}' - will be replaced
  other: obj => {
    if (!obj.id) return '' // don't include elements without an id (eg containers like 'DataItems')
    // use name/tag for last resort
    // eg <Axes id="a"> gives 'axes'
    // eg <Axes id="a" name="base"> gives 'base', but can translate with regexp later
    return (obj.name || obj.nativeName || obj.tag || '').toLowerCase()
  },
}

// handle dataitem steps
function getDataItemStep(obj) {
  const params = []
  if (obj.type) params.push(obj.type) // eg ['POSITION']
  if (obj.subType) params.push(obj.subType) // eg ['POSITION', 'ACTUAL']
  if (obj.category === 'CONDITION') params.push(obj.category)

  if (obj.coordinateSystemIdRef) {
    // see resolveReferences for translation
    params.push('${' + obj.coordinateSystemIdRef + '}') // eg '${mach}'
  }

  // add all other available attributes for path, eg coordinateSystem="MACHINE"
  //. what else do we need?
  //. handle discrete=true
  for (let attribute of attributes) {
    if (obj[attribute]) {
      params.push(obj[attribute])
    }
  }

  // build the step string
  const composition = obj.compositionId ? `$\{${obj.compositionId}}/` : '' // eg '${Cmotor}' - see resolveReferences
  const step = composition + params.map(getParamString).join('-') || '' // eg 'position-actual'
  return step
}

// get string representation of a parameter.
// remove leading x:, which indicates an ad-hoc value.
// eg 'x:SOME_TYPE' -> 'some_type'
function getParamString(param) {
  const str = param.toLowerCase().replace('x:', '') // leave underscores
  return str
}
