// run:
// cd pipeline/application
// npm test

import fs from 'fs' // node lib - filesystem
import convert from 'xml-js' // https://github.com/nashwaan/xml-js
import * as tree from './tree.js'

// const path = 'examples/mazak/probe5717sm.xml'
const path = 'examples/mazak/current5717.xml'
const xml = fs.readFileSync(path).toString()
const json = JSON.parse(convert.xml2json(xml, { compact: true }))
// const objs = tree.getProbeObjects(json)
const objs = tree.getObservationObjects(json)
console.log(objs)

// const nodesFile = 'foo.json'
// fs.writeFileSync(nodesFile, JSON.stringify(json, null, 2))
