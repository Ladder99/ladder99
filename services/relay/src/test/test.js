// run:
// cd services/relay
// node src/test/test.js

import fs from 'fs' // node lib - filesystem
import convert from 'xml-js' // https://github.com/nashwaan/xml-js
import * as treeProbe from '../treeProbe.js'
// import * as treeObservations from '../treeObservations.js'
// import * as lib from '../common/lib.js'

let args = process.argv.slice(2)

// option - update snapshot
let update = false
let print = false
if (args[0] === '-u') {
  update = true
  args = args.slice(1)
}
if (args[0] === '-p') {
  print = true
  args = args.slice(1)
}
const folders = args

for (let folder of folders) {
  const probeFile = `src/test/${folder}/probe.xml`
  const snapshotFile = `src/test/${folder}/probe.json`

  // get probe xml as json
  const json = getXmlToJson(probeFile)

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

  // get dictionary with id: path
  const current = {}
  for (let element of elements) {
    current[element.id] = element.path
  }
  const str = JSON.stringify(current, null, 2)
  if (print) {
    console.log(str)
    continue
  }
  if (update) {
    console.log('writing', snapshotFile)
    fs.writeFileSync(snapshotFile, str)
    continue
  }

  // get snapshot json with id:path
  const snapshot = getJson(snapshotFile)
  console.log(snapshot)

  // compare current and snapshot dictionaries
  for (let id of Object.keys(current)) {
    const actual = current[id]
    const expected = snapshot[id]
    const okay = actual === expected
    const status = okay ? '[OK]' : '[FAIL]'
    const should = okay ? '' : `(expected ${expected})`
    console.log(`${status} ${id}: ${actual} ${should}`)
  }
  // look for missing items
  for (let id of Object.keys(snapshot)) {
    if (!current[id]) {
      const expected = snapshot[id]
      console.log(`[FAIL] missing ${id} (expected ${expected})`)
    }
  }
}

// load an xml file, convert to json, parse and return
function getXmlToJson(path) {
  const xml = fs.readFileSync(path).toString()
  const json = JSON.parse(convert.xml2json(xml, { compact: true }))
  return json
}

function getJson(path) {
  const json = JSON.parse(fs.readFileSync(path).toString())
  return json
}
