// run:
// cd pipeline/application
// npm test

import fs from 'fs' // node lib - filesystem
import convert from 'xml-js' // https://github.com/nashwaan/xml-js
import * as tree from './tree.js'

// load and parse probe xml
// const json = getJson('examples/mazak/probe5717sm.xml')
// const json = getJson('examples/ccs-pa/probe.xml')
const json = getJson('examples/demo/devices.xml')
const objs = tree.getProbeObjects(json)
console.log(objs)
// console.log(objs.map(obj => `${obj.signature}: ${obj.id}`).join('\n'))
// process.exit(0)

// transform objs to db node structure
const nodes = objs.map(obj => {
  const node = { ...obj }
  node.type = obj.tag === 'DataItem' ? 'PropertyDef' : obj.tag
  //. or call this .id? but not unique unless include more of signature?
  node.canonicalId = obj.id //. look this up via signature property //. what about collisions eg system condition?
  // node.description = 'from pdf' //. or link to prepopulated nodes with descs
  //. include category, type? not sure
  delete node.tag
  delete node.category
  return node
})
console.log(nodes)
process.exit(0)

//. separate devices and props
// const devices = []
// const props = []

//. add to db

// add objs to an index
const propsById = {}
for (const obj of objs) {
  propsById[obj.id] = obj
}

// show a prop
console.log(propsById.operator)

// load and parse current xml
const json2 = getJson('examples/mazak/current5717.xml')
const objs2 = tree.getObservationObjects(json2)

// print an observation
console.log(objs2[0])

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
