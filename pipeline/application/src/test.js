// run:
// cd pipeline/application
// npm test

import fs from 'fs' // node lib - filesystem
import convert from 'xml-js' // https://github.com/nashwaan/xml-js
import * as tree from './tree.js'

const json = getJson('examples/mazak/probe5717sm.xml')
const objs = tree.getProbeObjects(json)
// console.log(objs)

const propsById = {}
for (const obj of objs) {
  propsById[obj.id] = obj
}
console.log(propsById.operator)

// const json2 = getJson('examples/mazak/current5717.xml')
// const objs2 = tree.getObservationObjects(json2)
// console.log(objs2)

// const nodesFile = 'foo.json'
// fs.writeFileSync(nodesFile, JSON.stringify(json, null, 2))

function getJson(path) {
  const xml = fs.readFileSync(path).toString()
  const json = JSON.parse(convert.xml2json(xml, { compact: true }))
  return json
}
