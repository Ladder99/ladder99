// test path generation from mtconnect agent xml
// see help below for usage
// see also 'test' script in top-level folder, which runs this

import fs from 'fs' // node filesystem library
import convert from 'xml-js' // xml parser https://github.com/nashwaan/xml-js
import chalk from 'chalk' // console colors https://github.com/chalk/chalk
import * as treeProbe from '../treeProbe.js' // our parser code to test
// import * as endpoint from '../endpoint.js' // includes xml parser factory
import * as lib from '../common/lib.js' // our library fns

// const parser = endpoint.getXMLParser()

const help = `
Test dataitem paths as generated from agent.xml.

Compares generated paths with snapshots, which can be updated with -u.
Use -p to print the generated paths.
Use -n to print the nodes as will be added to database.

Usage:
    cd services/relay
    node src/test/test.js [-u] [-p] [-n] folder [specifier]

Options:
    -u update snapshots for given folder
    -p print id:path json for given folder
    -n print nodes for given folder
    specifier - will be appended to filename as folder/agent-specifier.xml

Examples:
    npm test -p demo
`

// get options and folders from cmdline
const options = getOptions()

// show help
if (options.help) {
  console.log(help)
  process.exit(0)
}

const setupFile = `${options.clientFolder}/setup.yaml`
const probeFile = `${options.folder}/agent${options.specifier}.xml`
const snapshotFile = `${options.folder}/path-snapshot${options.specifier}.json`

const setup = lib.importYaml(setupFile) || {}

// parse xml to list of nodes and elements
//. make this a method in treeProbe, for testing

// const setup = lib.importYaml(setupFile) || {}
// const json = getXmlToJson(probeFile) // parse probe xml to json
// const elements = treeProbe.getElements(json) // devices, all dataitems
// const nodes = treeProbe.getNodes(elements, setup) // devices and unique propdefs
// simulateDb(nodes) // assign a unique node_id to each node
// const indexes = treeProbe.getIndexes(nodes, elements) // get { nodeByUid }
// treeProbe.assignNodeIds(elements, indexes) // assign device_id and dataitem_id to dataitem elements.
// const current = getCurrent(elements)

// from agentReader.js
// const probe = new Probe(setup, agent) // see dataProbe.js
// const endpoint = mock
// await probe.read(endpoint) // read xml into probe.js, probe.elements, probe.nodes
// console.log(probe.nodes)
// nodes = tree.getNodes(this.jsTree, this.setup, this.agent)

const agent = setup.relay.agents[2] //.. corresponds to `npm test demo mazak`
const jsTree = getXmlToJsTree(probeFile) // parse probe xml to jstree
const nodes = treeProbe.getNodes(jsTree, agent)

simulateDb(nodes) // assign a unique node_id to each node

// const indexes = treeProbe.getIndexes(nodes, elements) // get { nodeByUid }
// treeProbe.assignNodeIds(elements, indexes) // assign device_id and dataitem_id to dataitem elements.
// const current = getCurrent(elements)

// get indexes
const indexes = treeProbe.getIndexes(nodes)

// assign device_id and dataitem_id to dataitem elements.
// will need these to write values from current/sample endpoints
// to history and bins tables.
treeProbe.assignNodeIds(nodes, indexes)

// console.dir(nodes, { depth: 4 })
// console.log(indexes)

// console.log(nodes.filter(node => node.tag === 'Device'))

const device = indexes.nodeByUid['mazak5717/d1']
const dataitem = indexes.nodeByUid['mazak5717/d1/rmtmp1']
console.log(device)
console.log(dataitem)

process.exit(0)

// -----------------------------------------------------------------

// optional - write json to snapshot file
if (options.update) {
  console.log('writing', snapshotFile)
  const str = JSON.stringify(current, null, 2)
  fs.writeFileSync(snapshotFile, str)
  process.exit(0)
}

// optional - print nodes
if (options.nodes) {
  const str = JSON.stringify(nodes, null, 2)
  console.log(str)
  process.exit(0)
}

// optional - print json
// if (options.print) {
if (options.print || !fs.existsSync(snapshotFile)) {
  const str = JSON.stringify(current, null, 2)
  console.log(str)
  process.exit(0)
}

// if (!fs.existsSync(snapshotFile)) {
//   console.log(`No snapshot file - printing paths...`)
//   options.print = true
// }

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
  if (args[0] === '-n') {
    options.nodes = true
    args = args.slice(1)
  }
  options.folder = args[0]
  if (options.folder) {
    if (options.folder.startsWith('./')) {
      // options.clientFolder = 'services/relay/src/test/' + options.folder
      options.clientFolder = options.folder
      options.folder = options.clientFolder
    } else {
      // options.clientFolder = '../setup-' + options.folder
      options.clientFolder = '../../../setup-' + options.folder
      options.folder = options.clientFolder + '/volumes/agent'
    }
  }
  options.help = options.folder === undefined
  options.specifier = args[1] ? '-' + args[1] : ''
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

// load an xml file, convert to jstree, parse and return
function getXmlToJsTree(path) {
  // options copied from endpointjs
  const convertOptions = {
    compact: true,
    ignoreDoctype: true,
    ignoreDeclaration: true,
    ignoreInstruction: true,
    trim: true, // ditch whitespace around text values
    attributesKey: '_', // default is '_attributes'
    textKey: '$', // default is '_text'
  }
  const xml = fs.readFileSync(path).toString()
  const json = convert.xml2js(xml, convertOptions)
  return json
}

// load a json file
function getJson(path) {
  const json = JSON.parse(fs.readFileSync(path).toString())
  return json
}

// // import a yaml file and parse to js struct.
// // returns the js struct or null if file not avail.
// export function importYaml(path) {
//   try {
//     const yaml = fs.readFileSync(path, 'utf8')
//     const yamlTree = libyaml.load(yaml)
//     return yamlTree
//   } catch (error) {
//     console.log(error.message)
//   }
//   return null
// }
