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
//   node_type: 'DataItem',
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
//   agentAlias: 'Mazak5717',
//   deviceId: 'd1',
//   deviceAlias: 'Mill 12345',
//   contextId: 'Mazak5717/d1',
//   uid: 'Mazak5717/rmtmp1',
//   shortPath: 'd1/auxiliaries/environmental/temperature',
//   path: 'Mazak5717/d1/auxiliaries/environmental/temperature',
//   node_id: 149
// }, ...]
export async function getNodes(tree, agent) {
  const translationIndex = getTranslationIndex(agent) // map device id to device.translations, if any
  const devices = getDevices(agent) // maps device id->device node, if any
  let nodes = getList(tree) // flatten the tree
  addAgent(nodes, agent) // add agentAlias from setup to each element
  addDevice(nodes, devices) // add deviceId and deviceAlias to each element
  addContext(nodes) // contextId = agentAlias[/deviceId], eg 'Main/d1' - use this to lookup device in db
  addUid(nodes, agent) // uid = agentAlias[/dataitemId], eg 'Main/d1-avail'
  addStep(nodes, translationIndex) // eg 'System'
  const index = getIndexUidToNode(nodes) // get index, as used in resolveReferences
  resolveReferences(nodes, index) // resolve steps like '${Cmotor}' to 'Motor'
  addShortPath(nodes) // eg 'd1/Linear[x]/Velocity' //. currently includes deviceId? remove
  addPath(nodes) // eg 'Main/d1/Axes/Linear[X]/Velocity'
  addNodeType(nodes) // convert .tag='DataItem' etc to .node_type
  cleanup(nodes) // remove .parent, etc
  // nodes = nodes.filter(el => el.id === 'Mazak03-X_2') //..
  // console.log('getNodes', nodes)
  // process.exit(0)
  nodes = filterList(nodes) // only include nodes that have id
  // nodes = nodes.filter(el => el.node_type !== 'Composition') //. better way?
  // check for path collisions and resolve by adding name in brackets
  let collisions = await getPathCollisions(nodes)
  await resolveCollisions(collisions) // add [name] to path where needed
  collisions = await getPathCollisions(nodes) // check for any remaining collisions
  await handleCollisions(collisions) // print msg and stop if any left
  return nodes
}

// get translations for each device, eg 'd1' -> { base: 'axes', ... }
function getTranslationIndex(agent) {
  const translationIndex = {}
  if (agent.devices) {
    agent.devices.forEach(
      device => (translationIndex[device.id] = device.translations)
    )
  }
  return translationIndex
}

// add agent alias from setup yaml
function addAgent(list, agent) {
  for (let el of list) {
    if (el.id) el.agentAlias = agent.alias
  }
}

// get dict of devices as defined in setup.yaml - could be empty
function getDevices(agent) {
  const devices = {}
  if (agent.devices) {
    agent.devices.forEach(device => {
      devices[device.id] = device
    })
  }
  return devices
}

// add device/agent id and alias to elements
function addDevice(nodes, devices) {
  let deviceId
  let deviceAlias
  const missing = [] // list of deviceIds
  for (let node of nodes) {
    // grab agent or device id and alias
    if (node.tag === 'Agent' || node.tag === 'Device') {
      deviceId = node.id
      deviceAlias = devices[deviceId]?.alias
      if (node.tag === 'Device' && !deviceAlias) {
        missing.push(deviceId)
        // console.dir(node, { depth: 3 })
        deviceAlias =
          node.name ||
          node.description?.value ||
          node.description?.manufacturer + '_' + node.description?.model
        deviceAlias = deviceAlias.replace(/ /g, '_')
      }
    }
    // assign each element its ancestor's id in the device attribute.
    // but only if the element has an id - don't need/want it otherwise.
    if (deviceId && node.id) node.deviceId = deviceId
    // save device alias too
    if (deviceId && deviceAlias) node.deviceAlias = deviceAlias
  }
  if (missing.length) {
    console.log(`
Relay warning: the following devices have no alias - could add in setup.yaml.
`)
    // console.log(missing.join('\n'))
    for (let deviceId of missing) {
      console.log(`Alias missing for ${deviceId}`)
    }
    console.log()
  }
}

// add contextId (agentAlias/deviceId) to each element, eg 'Main/m'.
// if it's a device or agent though, contextId is just agentAlias, eg 'Main'.
function addContext(list) {
  for (let el of list) {
    const isDevice = el.tag === 'Device' || el.tag === 'Agent'
    let contextId = el.agentAlias ? el.agentAlias : ''
    if (!isDevice) contextId += el.deviceId ? '/' + el.deviceId : ''
    if (contextId) el.contextId = contextId
  }
}

// add uid to elements, eg 'Main/m-avail'
function addUid(list, agent) {
  for (let el of list) {
    if (el.id) {
      const uid = agent.alias + (el.id ? '/' + el.id : '')
      if (uid) el.uid = uid
    }
  }
}

// add path for each element
//. this is currently including the device - remove it? but check addPath below
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
    el.path = el.agentAlias + (el.shortPath ? '/' + el.shortPath : '')
    // el.path = el.agentAlias + '/' + el.deviceAlias + '/' + el.shortPath
    // el.path = el.contextId + (el.shortPath ? '/' + el.shortPath : '')
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

// each node element gets a 'step' attribute which is its contribution to the path
function addStep(list, translationIndex) {
  for (let el of list) {
    const translations = translationIndex[el.deviceId] || {}
    const step = getStep(el, translations)
    if (step) el.step = step
  }
}

// filter the list of elements down to those needed for the relay and db
function filterList(list) {
  // list = list.filter(el => !!el.id) // just need those with an id
  // list = list.filter(el => el.node_type !== 'Composition')
  list = list.filter(
    el => el.node_type === 'Device' || el.node_type === 'DataItem'
  )
  return list
}

// get an index for uid (eg 'Main/m-avail') to node.
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
        // const uid = el.contextId + '/' + id // eg 'main/m1/Cmotor'
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
      // const tagid = lib.getCamelCase(obj.tag) // eg 'filters'
      const tagid = toPascalCase(obj.tag) // eg 'Filters'
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

// get path step for the given node
// eg
//   for a Device node, return device alias
//   for a DataItem node, return 'PositionActual'
function getStep(obj, translations) {
  const translation = translations[obj.id] // eg 'a'->'Axes'
  if (translation) return translation
  // call the step handler for the given tag, or a fallback handler
  const stepHandler = stepHandlers[obj.tag] || stepHandlers.other
  const step = stepHandler(obj)
  return step
}

const stepHandlers = {
  MTConnectDevices: obj => obj.agentAlias,
  Agent: obj => obj.deviceAlias || obj.deviceId,
  Device: obj => obj.deviceAlias || obj.deviceId, // use alias if specified
  // Agent: obj => obj.deviceId,
  // Device: obj => obj.deviceId,
  // Linear: obj => `linear[${obj.name.toLowerCase()}]`,
  // Rotary: obj => `rotary[${obj.name.toLowerCase()}]`,
  Axes: obj => `Axes`, //[${obj.name}]`,
  Controller: obj => `Controller`, //[${obj.name}]`,
  Linear: obj => `Linear[${obj.name}]`,
  Rotary: obj => `Rotary[${obj.name}]`,
  DataItem: getDataItemStep,
  ref: obj => '${' + obj.id + '}', // eg '${m1-foo}' - will be replaced
  other: obj => {
    if (!obj.id) return '' // don't include elements without an id (eg containers like 'DataItems')
    // use name/tag for last resort
    // eg <Axes id="a"> gives 'axes'
    // eg <Axes id="a" name="base"> gives 'base', but can translate with regexp later
    //. why this way?
    // return (obj.name || obj.nativeName || obj.tag || '').toLowerCase()
    return obj.name || obj.nativeName || obj.tag || ''
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
  //. add all attributes in alpha order, minus those already added - type, subtype, cat, etc?
  for (let attribute of attributes) {
    if (obj[attribute]) {
      params.push(obj[attribute])
    }
  }

  // build the step string
  const composition = obj.compositionId ? `$\{${obj.compositionId}}/` : '' // eg '${Cmotor}' - see resolveReferences
  // const step = composition + params.map(getParamString).join('-') || '' // eg 'motor/position-actual'
  const step = composition + params.map(getParamString).join('') || '' // eg 'Motor/PositionActual'
  return step
}

// get string representation of a parameter.
// remove leading x:, which indicates an ad-hoc value.
//x eg 'X:SOME_TYPE' -> 'some_type'
// eg 'X:SOME_TYPE' -> 'SomeType'
function getParamString(param) {
  // const str = param.toLowerCase().replace('x:', '') // leave underscores
  // param = param.replace('X:', '').replace(':x','')
  param = param.replace(/^[xX][:]/, m => '')
  return toPascalCase(param)
}

// convert foo_bar to fooBar, etc
//. move to libjs
function toCamelCase(str) {
  return str
    .toLowerCase()
    .replace(/([-_][a-z])/gi, m =>
      m.toUpperCase().replace('-', '').replace('_', '')
    )
}

// convert FOO_BAR to FooBar, etc
//. move to libjs
function toPascalCase(str) {
  str = toCamelCase(str)
  return str[0].toUpperCase() + str.slice(1)
}

// -----------------------------------------------------------------

// get indexes for given nodes
// - nodeByUid - map of uid to node
export function getIndexes(nodes) {
  //
  // init indexes
  const nodeByUid = {}

  // add nodes
  for (let node of nodes) {
    nodeByUid[node.uid] = node
  }

  return { nodeByUid }
}

// assign device_id and dataitem_id to nodes.
// will use these to write values to history and bins tables.
export function assignNodeIds(nodes, indexes) {
  nodes.forEach(node => {
    if (node.node_type === 'DataItem') {
      node.device_id = indexes.nodeByUid[node.contextId].node_id
      node.dataitem_id = indexes.nodeByUid[node.uid].node_id
    }
  })
}

// get list of path collisions
async function getPathCollisions(nodes) {
  // get dict with path=>[node1, node2, ...]
  const pathNodes = {}
  for (let node of nodes) {
    if (pathNodes[node.path]) {
      pathNodes[node.path].push(node)
    } else {
      pathNodes[node.path] = [node]
    }
  }
  // get list of collisions
  const collisions = []
  for (let key of Object.keys(pathNodes)) {
    if (pathNodes[key].length > 1) {
      collisions.push(pathNodes[key])
    }
  }
  return collisions
}

async function handleCollisions(collisions) {
  if (collisions.length > 0) {
    console.log(`
Relay error: The following dataitems have duplicate paths, 
ie same positions in the XML tree and type+subtype. 
Please add translations for them in setup.yaml for this project.

eg with the following output,
  Cload: Mazak5701/d1/base/rotary[c]/load
  Sload: Mazak5701/d1/base/rotary[c]/load

you could add the following translation block to setup.yaml:
  relay:
    agents:
      - alias: Mazak5701
        url: http://mtconnect.mazakcorp.com:5701
        devices:
          - id: d1
            alias: Mill12345
            translations:
              Cload: load-index
              Sload: load-spindle

giving the following unique paths -
  Mazak5701/d1/base/rotary[c]/load-index
  Mazak5701/d1/base/rotary[c]/load-spindle
`)
    for (let collision of collisions) {
      console.log(collision.map(node => `${node.id}: ${node.path}`).join('\n'))
      console.log()
    }
    console.log(
      `Exiting after 5 secs - please run 'docker stop relay' to prevent restart.`
    )
    await new Promise(resolve => setTimeout(resolve, 5000)) // pause
    process.exit(1)
  }
}

// resolve collisions by appending name in brackets
async function resolveCollisions(collisions) {
  if (collisions.length === 0) return
  console.log(`Resolving collisions by adding [name|nativeName|id] to path...`)
  console.log(`These are id:path pairs`)
  console.log(`If you don't like these, you can add translations in setup.yaml`)
  console.log()
  for (let collision of collisions) {
    for (let node of collision) {
      // append brackets
      const name = node.name || node.nativeName || node.id
      // node.path = `${node.path}[${name.toLowerCase()}]`
      node.path = `${node.path}[${name}]`
      console.log(`Collision resolved for ${node.id}: ${node.path}`)
    }
    console.log()
  }
}
