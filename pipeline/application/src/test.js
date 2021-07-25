// run:
// cd pipeline/application
// npm test

import fs from 'fs' // node lib - filesystem
import convert from 'xml-js' // https://github.com/nashwaan/xml-js
import * as tree from './tree.js'
import * as common from './common.js'

console.log()
console.log('test.js')
console.log('------------------------------------------------')
console.log()

// load and parse probe xml
// const json = getJson('examples/demo/devices.xml')
// const json = getJson('examples/vmc/probe.xml')
const json = getJson('examples/ccs-pa/probe.xml')
// const json = getJson('examples/mazak/probe5717.xml')

// const objs = tree.getObjects(json)
// console.log(objs[1]) // {
//   tag: 'DataItem',
//   id: 'pa1-connection',
//   category: 'EVENT',
//   type: 'AVAILABILITY',
//   steps: [ '', 'availability' ]
// }

const foos = tree.getFoos(json)
console.log(foos[1]) // { id: 'pa1-connection', type: 'DataItem', path: 'availability' }
const dataItemIdToNodeId = {}

// const devices = tree.getDevices(nodes)

//. these will get added to db nodes table, and node_id added to them
//. also keep dict of path -> node_id
// const propdefs = tree.getPropertyDefs(nodes)
// const { devices, propdefs } = tree.getNodes(foos)
const nodes = tree.getNodes(foos)

nodes.forEach((node, i) => (node.node_id = i + 1)) // emulate db add/get
console.log(nodes[0]) // { type: 'PropertyDef', path: 'availability' }
const propdefPathToNodeId = {}
nodes.forEach(node => (propdefPathToNodeId[node.path] = node.node_id))

nodes.forEach(
  node => (dataItemIdToNodeId[node.id] = propdefPathToNodeId[node.path])
)
console.log(dataItemIdToNodeId) // maps current/sample id to propdef node_id

process.exit(0)

// // load and parse current xml
// const json2 = getJson('examples/mazak/current5717.xml')
// const objs2 = tree.getObservationObjects(json2)

// // print an observation
// console.log(objs2[0])

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

// const yaml = common.importYaml('./src/canonical.yaml')
// console.log(yaml)
