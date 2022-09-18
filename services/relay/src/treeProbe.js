// companion functions for dataProbe.js

import * as lib from './common/lib.js'

// don't record these tags or their children
// the Agent tag has lots of extraneous stuff we don't want to record, yet
const skipTags = lib.getSet('Agent')

//. will want to keep track of attributes tacked onto the path -
// and/or specify them all in advance so they're in a known order
//. what else do we need?
//. or better - specify the main ones in order, then anything else goes in alpha order
const attributes = 'coordinateSystem,statistic'.split(',')

// -------------------------------------------

// get flat list of nodes from given tree by recursing through probe structure.
// eg
//   tree = { MTConnectDevices: { Header, Devices: { Agent, Device } } }
//   with Device = { _, Description, DataItems, Components: { Axes, Controller, Systems }}
//   and DataItems = { DataItem: [ { _: { id, type, category }}, ...]}
//   where _ is an object with the attributes and values
// gives something like [{
//   tag: 'DataItem',
//   category: 'SAMPLE',
//   id: 'rmtmp1',
//   nativeUnits: 'CELSIUS',
//   type: 'TEMPERATURE',
//   units: 'CELSIUS',
//   filters: {
//     filter: {
//       type: 'MINIMUM_DELTA',
//       value: '0.5',
//     },
//   },
//   agentAlias: 'mazak5717',
//   deviceId: 'd1',
//   contextPath: 'mazak5717/d1',
//   uid: 'mazak5717/rmtmp1',
//   shortPath: 'd1/auxiliaries/environmental/temperature',
//   path: 'mazak5717/d1/auxiliaries/environmental/temperature',
//   node_id: 149
// }, ...]
export function getNodes(tree, agent) {
  // get translations for each device, eg 'd1' => { base: 'axes', ... }
  const translationIndex = {}
  if (agent.devices) {
    agent.devices.forEach(
      device => (translationIndex[device.id] = device.translations)
    )
  }
  let list = getList(tree) // flatten the tree
  addAgent(list, agent) // add agentAlias from setup to each element
  addDevice(list) // add deviceId to each element
  // addContext(list) // contextPath = agentAlias[/deviceId], eg 'main/d1'
  addContext(list) // contextPath = agentAlias[/deviceAlias], eg 'Main/MazakM123'
  addUid(list, agent) // uid = agentAlias[/dataitemId], eg 'main/d1-avail'
  addStep(list, translationIndex) // eg 'system'
  const index = getIndexUidToNode(list)
  resolveReferences(list, index) // resolve steps like '${Cmotor}' to 'motor'
  addShortPath(list) // eg 'd1/linear[x]/velocity' //. currently includes device tho - remove
  addPath(list) // eg 'main/d1/linear[x]/velocity'
  addNodeType(list) // convert .tag='DataItem' etc to .node_type
  cleanup(list)
  // list.forEach(el => delete el.parent) // remove parent attributes
  // list = list.filter(el => el.id === 'servo_cond')
  // console.log(list)
  // process.exit(0)
  list = filterList(list) // only include nodes that have id
  return list
}

// add agent alias from setup yaml
function addAgent(list, agent) {
  for (let el of list) {
    if (el.id) el.agentAlias = agent.alias
  }
}

// add device/agent id to elements
function addDevice(list) {
  let deviceId
  for (let el of list) {
    // grab agent or device id
    if (el.tag === 'Agent' || el.tag === 'Device') {
      deviceId = el.id
    }
    // assign each element its ancestor's id in the device attribute.
    // but only if the element has an id - don't need/want it otherwise.
    if (deviceId && el.id) el.deviceId = deviceId
  }
}

// add contextPath (agentAlias/deviceId) to each element, eg 'main/m1'.
// if it's a device or agent though, contextPath is just agentAlias, eg 'main'.
function addContext(list) {
  for (let el of list) {
    const isDevice = el.tag === 'Device' || el.tag === 'Agent'
    let contextPath = el.agentAlias ? el.agentAlias : ''
    if (!isDevice) contextPath += el.deviceId ? '/' + el.deviceId : ''
    if (contextPath) el.contextPath = contextPath
  }
}

// add uid to elements, eg 'main/m1-avail'
function addUid(list, agent) {
  for (let el of list) {
    if (el.id) {
      // const uid = el.contextPath + (el.id ? '/' + el.id : '')
      const uid = agent.alias + (el.id ? '/' + el.id : '')
      if (uid) el.uid = uid
    }
  }
}

// add path for each element
function addShortPath(list) {
  for (let el of list) {
    // build up the path starting from the root ancestor.
    // this only works because the nodes are in proper order.
    if (el.parent && el.parent.shortPath) {
      el.shortPath = el.parent.shortPath + (el.step ? '/' + el.step : '')
    } else {
      el.shortPath = el.step
    }
  }
}

// add a full path to each element, which includes the parents up to the agent
function addPath(list) {
  for (let el of list) {
    el.path = el.agentAlias + '/' + el.shortPath
  }
}

function addNodeType(list) {
  for (let el of list) {
    el.node_type = el.tag
  }
}

// -----------------------------------------------------------------

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
    delete el.tag
    if (!el.id) {
      delete el.path
      delete el.shortPath
    }
  }
}

function addStep(list, translationIndex) {
  for (let el of list) {
    const translations = translationIndex[el.deviceId] || {}
    const step = getStep(el, translations)
    if (step) el.step = step
  }
}

// filter the list of elements down to those needed for the relay and db
function filterList(list) {
  return list.filter(el => !!el.id) // just need those with an id
}

// get an index for full id (eg 'main/m/m1-avail') to element.
function getIndexUidToNode(list) {
  const index = {}
  for (let el of list) {
    if (el.uid) {
      index[el.uid] = el
    }
  }
  return index
}

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
        const id = match[1] // eg 'Cmotor'
        // const uid = el.agentAlias + '/' + el.deviceId + '/' + id // eg 'main/m1/Cmotor'
        // const uid = el.contextPath + '/' + id // eg 'main/m1/Cmotor'
        const uid = el.agentAlias + '/' + id // eg 'main/Cmotor'
        const node = index[uid] // get the node object
        if (node) {
          // replace original with new step string, eg 'Cmotor-${id}' -> 'Cmotor-motor[a]'
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
    // skip tags and their children we don't care about, eg 'Agent'
    if (skipTags.has(tag)) return

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
  // call the step handler for the given tag, or a fallback handler
  const stepHandler = stepHandlers[obj.tag] || stepHandlers.other
  const step = stepHandler(obj)
  // handle translation
  const translation = translations[step]
  if (translation) return translation
  return step
}

const stepHandlers = {
  MTConnectDevices: () => obj.agentAlias,
  Agent: obj => obj.deviceId,
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
    //. why this way?
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
  const step = composition + params.map(getParamString).join('-') || '' // eg 'motor/position-actual'
  return step
}

// get string representation of a parameter.
// remove leading x:, which indicates an ad-hoc value.
// eg 'x:SOME_TYPE' -> 'some_type'
function getParamString(param) {
  const str = param.toLowerCase().replace('x:', '') // leave underscores
  return str
}

// -----------------------------------------------------------------

// get indexes for given nodes: nodeByNodeId, nodeByUid.
// eg for
//   nodes = [{ node_id: 3, id: 'foo', uid: 'd1/foo', path: 'bar' }, ...]
// returns
//   { nodeByNodeId: { 3: {...} }, nodeByUid: { 'd1/foo':... } }
//. explain why we need each index - what uses them
export function getIndexes(nodes) {
  //
  // init indexes
  const nodeByNodeId = {}
  const nodeByUid = {}

  // add nodes
  for (let node of nodes) {
    nodeByNodeId[node.node_id] = node
    nodeByUid[node.uid] = node
  }

  return { nodeByNodeId, nodeByUid }
}

// assign device_id and dataitem_id to nodes.
// will use these to write values to history and bins tables.
export function assignNodeIds(nodes, indexes) {
  nodes.forEach(node => {
    if (node.node_type === 'DataItem') {
      node.device_id = indexes.nodeByUid[node.contextPath].node_id
      node.dataitem_id = indexes.nodeByUid[node.uid].node_id
    }
  })
}
