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

//------------------------------------------------------------------------

// get objects (devices, all dataitems)
const objs = tree.getObjects(json)
console.log(objs)
exit()

// get nodes (devices, unique propdefs)
const nodes = tree.getNodes(objs)

// simulate db add/get - assign node_id
nodes.forEach((node, i) => (node.node_id = i + 1))

// map from propdef.path to node_id
const pathToNodeId = {}
nodes.forEach(node => (pathToNodeId[node.path] = node.node_id))

// map from current/sample dataitem.id to propdef.node_id
const dataItemIdToNodeId = {}
nodes.forEach(node => (dataItemIdToNodeId[node.id] = pathToNodeId[node.path]))
console.log(dataItemIdToNodeId)

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
