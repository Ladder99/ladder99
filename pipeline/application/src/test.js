// run:
// cd pipeline/application
// npm test

import fs from 'fs' // node lib - filesystem
import convert from 'xml-js' // https://github.com/nashwaan/xml-js
import * as tree from './tree.js'

const path = 'examples/mazak/probe5717sm.xml'
const xml = fs.readFileSync(path).toString()
const json = JSON.parse(convert.xml2json(xml, { compact: true }))
// console.log(json)
// libapp.print(json)

const els = tree.getElements(json)
console.log(els)

// const nodesFile = 'nodes.json'
// fs.writeFileSync(nodesFile, JSON.stringify(nodes, null, 2))
