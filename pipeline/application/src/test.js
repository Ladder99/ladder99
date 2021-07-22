// run:
// cd pipeline/application
// npm test

import fs from 'fs' // node lib - filesystem
import convert from 'xml-js' // https://github.com/nashwaan/xml-js
import * as tree from './tree.js'

// load and parse probe xml
const json = getJson('examples/mazak/probe5717sm.xml')
const objs = tree.getProbeObjects(json)

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
