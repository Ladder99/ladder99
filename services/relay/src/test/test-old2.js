// test path generation from mtconnect agent xml

import fs from 'fs' // node filesystem library
import convert from 'xml-js' // xml parser https://github.com/nashwaan/xml-js
import chalk from 'chalk' // console colors https://github.com/chalk/chalk
import * as treeProbe from '../treeProbe.js' // our parser code to test

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
const options = getOptions()

// show help
if (options.help) {
  console.log(help)
  process.exit(0)
}

for (let folder of options.folders) {
  const probeFile = `src/test/${folder}/probe.xml`
  const snapshotFile = `src/test/${folder}/probe.json`

  // parse xml to list of nodes and elements
  const json = getXmlToJson(probeFile) // parse probe xml to json
  const elements = treeProbe.getElements(json) // devices, all dataitems
  const nodes = treeProbe.getNodes(elements) // devices and unique propdefs
  simulateDb(nodes) // assign a unique node_id to each node
  const indexes = treeProbe.getIndexes(nodes, elements) // get { nodeByNodeId, nodeByPath, elementById }
  treeProbe.assignNodeIds(elements, indexes) // assign device_id and dataitem_id to dataitem elements.
  const current = getCurrent(elements)

  // optional - print json
  if (options.print) {
    const str = JSON.stringify(current, null, 2)
    console.log(str)
    continue
  }

  // optional - write json to snapshot file
  if (options.update) {
    console.log('writing', snapshotFile)
    const str = JSON.stringify(current, null, 2)
    fs.writeFileSync(snapshotFile, str)
    continue
  }

  // get snapshot json with id:path
  const snapshot = getJson(snapshotFile)

  // compare current and snapshot dictionaries
  const paths = {}
  for (let id of Object.keys(current)) {
    const actual = current[id]
    const expected = snapshot[id]
    const element = indexes.elementById[id]
    const fullpath = element ? element.device + '/' + actual : actual
    const duplicate = paths[fullpath]
    paths[fullpath] = true
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

  // look for missing items also
  for (let id of Object.keys(snapshot)) {
    if (!current[id]) {
      const expected = snapshot[id]
      console.log(`[FAIL] missing ${id} (expected ${expected})`)
    }
  }
}

// ---------------------- helpers

// parse command line arguments, return as options
function getOptions() {
  const options = {}
  let args = process.argv.slice(2)
  if (args[0] === '-u') {
    options.update = true
    args = args.slice(1)
  }
  if (args[0] === '-p') {
    options.print = true
    args = args.slice(1)
  }
  options.folders = args
  options.help = options.folders.length === 0
  return options
}

// assign a unique node_id to each node
function simulateDb(nodes) {
  nodes.forEach((node, i) => (node.node_id = i + 1))
}

// get dictionary with id: path
function getCurrent(elements) {
  //. better way?
  const current = {}
  for (let element of elements) {
    if (
      element.node_type !== 'Device' &&
      element.node_type !== 'Composition' &&
      element.node_type !== 'CoordinateSystem'
    ) {
      current[element.id] = element.path
    }
  }
  return current
}

// load an xml file, convert to json, parse and return
function getXmlToJson(path) {
  const xml = fs.readFileSync(path).toString()
  const json = JSON.parse(convert.xml2json(xml, { compact: true }))
  return json
}

// load a json file
function getJson(path) {
  const json = JSON.parse(fs.readFileSync(path).toString())
  return json
}
