// run:
// cd pipeline/application
// npm test

import fs from 'fs' // node lib - filesystem
import convert from 'xml-js' // https://github.com/nashwaan/xml-js
import * as tree from './tree.js'
import * as common from './common.js'

// load and parse probe xml
// const json = getJson('examples/mazak/probe5717sm.xml')
const json = getJson('examples/ccs-pa/probe.xml')
// const json = getJson('examples/demo/devices.xml')
const objs = tree.getProbeObjects(json)
console.log(objs)
// console.log(objs.map(obj => `${obj.signature}: ${obj.id}`).join('\n'))
// process.exit(0)

const yaml = common.importYaml('./src/canonical.yaml')
console.log(yaml)

// transform objs to db node structure
const nodes = objs.map(obj => {
  const node = { ...obj }
  node.type = obj.tag === 'DataItem' ? 'PropertyDef' : obj.tag
  //. or call this .id? but not unique unless include more of signature?
  // node.canonicalId = obj.id //. look this up via signature property //. what about collisions eg system condition?
  // node.canonicalId = yaml.paths[obj.signature]
  node.path =
    obj.steps &&
    obj.steps
      .map(getCanonicalStep)
      .filter(step => !!step)
      .join('/')
  //. include category, type? not sure
  delete node.tag
  delete node.category
  delete node.steps
  return node
})
console.log(nodes)

function getCanonicalStep(step) {
  const canonicalStep = yaml.paths[step]
  if (canonicalStep === null) return ''
  return canonicalStep || step
}

// process.exit(0)

// separate devices and propdefs
const devices = {}
const propdefs = {}
for (const node of nodes) {
  if (node.type === 'Device') {
    // devices.push(node)
    devices[node.id] = node
  } else {
    // propdefs.push(node)
    const propdef = { ...node }
    delete propdef.id
    propdefs[node.path] = propdef
  }
}
console.log(devices)
console.log(propdefs)

process.exit(0)

//. add to db

// add objs to an index
const propsById = {}
for (const obj of objs) {
  propsById[obj.id] = obj
}

// show a prop
console.log(propsById.operator)

// load and parse current xml
const json2 = getJson('examples/mazak/current5717.xml')
const objs2 = tree.getObservationObjects(json2)

// print an observation
console.log(objs2[0])

//

// save json to a file
// const nodesFile = 'foo.json'
// fs.writeFileSync(nodesFile, JSON.stringify(json, null, 2))

// load an xml file, convert to json, parse and return
function getJson(path) {
  const xml = fs.readFileSync(path).toString()
  const json = JSON.parse(convert.xml2json(xml, { compact: true }))
  return json
}
