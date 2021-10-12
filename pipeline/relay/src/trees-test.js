// run:
// cd pipeline/relay
// npm test

import fs from 'fs' // node lib - filesystem
import convert from 'xml-js' // https://github.com/nashwaan/xml-js
import * as treeProbe from './treeProbe.js'
import * as treeObservations from './treeObservations.js'
import * as common from './common.js'

console.log()
console.log('test.js')
console.log('------------------------------------------------')
console.log()

//------------------------------------------------------------------------

// load and parse probe xml

//. choose a folder
const folder = 'examples/demo'
// const folder = 'examples/vmc'
// const folder = 'examples/ccs-pa'
// const folder = 'examples/mazak'

// get probe xml
const json = getJson(`${folder}/probe.xml`)
// console.log(json)
// console.log(json.MTConnectDevices.Devices.Device)
// console.log(json.MTConnectDevices.Devices.Device.DataItems.DataItem[0])

// get elements (devices, all dataitems)
const elements = treeProbe.getElements(json) //.slice(0, 3)
console.log('elements', elements)

// get nodes (devices, unique propdefs)
const nodes = treeProbe.getNodes(elements) //.slice(0, 3)
console.log('nodes', nodes)

// simulate db add/get - assign node_id to each node
nodes.forEach((node, i) => (node.node_id = i + 1))

const indexes = treeProbe.getIndexes(nodes, elements)

treeProbe.assignNodeIds(elements, indexes)

console.log('indexes', indexes)

//------------------------------------------------------------------------

// // load and parse current xml
// const json2 = getJson(`${folder}/current.xml`)

// const observations = treeObservations.getElements(json2)
// // console.log(observations)

// for (let obs of observations) {
//   const node = indexes.objById[obs.dataItemId]
//   if (node) {
//     const { device_id, property_id } = node
//     console.log(
//       `write to node ${device_id}, property ${property_id}, time ${obs.timestamp}, value ${obs.value}`
//     )
//   }
// }

//------------------------------------------------------------------------

// // load and parse sample xml
// const json3 = getJson(`${folder}/sample.xml`)

// const observations3 = treeObservations.getElements(json3)
// // console.log(observations)

// for (let obs of observations3) {
//   const node = indexes.objById[obs.dataItemId]
//   if (node) {
//     const { device_id, property_id } = node
//     console.log(
//       `write to node ${device_id}, property ${property_id}, time ${obs.timestamp}, value ${obs.value}`
//     )
//   }
// }

//------------------------------------------------------------------------

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
