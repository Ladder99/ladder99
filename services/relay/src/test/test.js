import fs from 'fs' // node filesystem library
import convert from 'xml-js' // xml parser https://github.com/nashwaan/xml-js
import chalk from 'chalk' // console colors https://github.com/chalk/chalk
import * as treeProbe from '../treeProbe.js'

const help = `
Test dataitem paths as generated from probe.xml for different examples.

Compares generated paths with snapshots, which can be updated with -u.
Use -p to print the generated paths.

Usage:
    cd services/relay
    node src/test/test.js [-u] [-p] folder1 [folder2...]

Options:
    -u update snapsots for given folders
    -p print id:path for given folders
`

// get options and folders from cmdline
let args = process.argv.slice(2)
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

if (folders.length === 0) {
  console.log(help)
  process.exit(0)
}

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
    if (element.node_type !== 'Composition') {
      current[element.id] = element.path
    }
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
  // console.log(snapshot)

  // compare current and snapshot dictionaries
  const paths = {}
  for (let id of Object.keys(current)) {
    const actual = current[id]
    const expected = snapshot[id]
    const duplicate = paths[actual]
    paths[actual] = true
    const okay = actual === expected && !duplicate
    const status = okay ? chalk.green('[OK]  ') : chalk.red('[FAIL]')
    const added = expected === undefined
    const should = okay
      ? ''
      : duplicate
      ? '(duplicate path)'
      : added
      ? '(not in snapshot)'
      : `(expected ${chalk.hex('#99d')(expected)})`
    console.log(`${status} ${id}: ${chalk.hex('#99d')(actual)} ${should}`)
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
