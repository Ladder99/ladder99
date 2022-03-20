// run:
// cd services/relay
// node src/test/test.js

import fs from 'fs' // node lib - filesystem
import convert from 'xml-js' // https://github.com/nashwaan/xml-js
import * as treeProbe from '../treeProbe.js'
// import * as treeObservations from '../treeObservations.js'
// import * as lib from '../common/lib.js'

// option - update snapshot
if (process.argv[2] === '-u') {
  console.log('hi')
}

//. choose a folder
// const folder = 'src/test/demo'
// const folder = 'src/test/vmc'
// const folder = 'src/test/print-apply'
// const folder = 'src/test/mazak'

const folders = 'demo,mazak,print-apply,vmc'.split(',')

for (let folder of folders) {
  const probeFile = `src/test/${folder}/probe.xml`
  const snapshotFile = `src/test/${folder}/probe.json`

  // get probe xml
  // const json = getJson(`${folder}/probe.xml`)
  const json = getJson(probeFile)

  // get elements (devices, all dataitems)
  // these include devices as props like device:'Device[camera2]'
  const elements = treeProbe.getElements(json)
  // console.log('elements', elements)

  // get nodes (devices and unique propdefs)
  const nodes = treeProbe.getNodes(elements)
  // console.log('nodes', nodes)

  // simulate db add/get - assign node_id to each node
  nodes.forEach((node, i) => (node.node_id = i + 1))

  const indexes = treeProbe.getIndexes(nodes, elements)

  treeProbe.assignNodeIds(elements, indexes)
  // console.log('elements', elements)
  // eg
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

  const d = {}
  for (let element of elements) {
    d[element.id] = element.path
  }
  console.log(JSON.stringify(d, null, 2))
}

// load an xml file, convert to json, parse and return
function getJson(path) {
  const xml = fs.readFileSync(path).toString()
  const json = JSON.parse(convert.xml2json(xml, { compact: true }))
  return json
}
