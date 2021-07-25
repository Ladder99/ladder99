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

const objs = tree.getObjects(json)
console.log(objs)
console.log(objs.map(obj => `${obj.id}`).join('\n'))
// process.exit(0)

// const yaml = common.importYaml('./src/canonical.yaml')
// console.log(yaml)

const nodes = tree.getNodes(objs)

// const dict = tree.getProbeDict(json)
// console.log(dict)
const propdefs = tree.getPropertyDefs(nodes)
console.log(propdefs)

// const nodes = Object.values(dict)
// console.log(nodes)
// console.log(nodes.map(node => node.path))

// show a propdef
// console.log(dict.message)

//. add devices and propdefs to db

// for (let device of Object.values(devices)) {
//   device.node_id = db.add(device)
// }

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
