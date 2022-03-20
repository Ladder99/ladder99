// run:
// cd services/relay
// node src/test/print.js

import fs from 'fs' // node lib - filesystem
import convert from 'xml-js' // https://github.com/nashwaan/xml-js
import * as treeProbe from '../treeProbe.js'
// import * as treeObservations from '../treeObservations.js'
// import * as lib from '../common/lib.js'

//. choose a folder
const folder = 'src/test/demo'
// const folder = 'src/test/vmc'
// const folder = 'src/test/print-apply'
// const folder = 'src/test/mazak'

// get probe xml
const json = getJson(`${folder}/probe.xml`)
// console.log(json)
// console.log(json.MTConnectDevices.Devices.Device)
// console.log(json.MTConnectDevices.Devices.Device.DataItems.DataItem[0])

// get elements (devices, all dataitems)
// these include devices as props like device:'Device[camera2]'
const elements = treeProbe.getElements(json) //.slice(0, 3)
// console.log('elements', elements)

// get nodes (devices and unique propdefs)
const nodes = treeProbe.getNodes(elements) //.slice(0, 3)
// console.log('nodes', nodes)

// simulate db add/get - assign node_id to each node
nodes.forEach((node, i) => (node.node_id = i + 1))

const indexes = treeProbe.getIndexes(nodes, elements)

treeProbe.assignNodeIds(elements, indexes)
// console.log('elements', elements)
// {
//   node_type: 'DataItem',
//   path: 'availability',
//   id: 'd1-avail',
//   category: 'EVENT',
//   type: 'AVAILABILITY',
//   device: 'Device[camera1]',
//   device_id: 1,
//   dataitem_id: 2
// },
// {
//   node_type: 'DataItem',
//   path: 'availability',
//   id: 'd2-avail',
//   category: 'EVENT',
//   type: 'AVAILABILITY',
//   device: 'Device[camera2]',
//   device_id: 8,
//   dataitem_id: 2
// },

const paths = elements.map(element => element.path)
console.log(paths.join('\n'))

// console.log('indexes', indexes)

// load an xml file, convert to json, parse and return
function getJson(path) {
  const xml = fs.readFileSync(path).toString()
  const json = JSON.parse(convert.xml2json(xml, { compact: true }))
  return json
}
