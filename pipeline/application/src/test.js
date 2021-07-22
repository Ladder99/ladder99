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
// console.log(json)
// libapp.print(json)

const objs = tree.getObjects(json)
console.log(objs)

// const nodesFile = 'nodes.json'
// fs.writeFileSync(nodesFile, JSON.stringify(nodes, null, 2))
