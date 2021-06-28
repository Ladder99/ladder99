import fs from 'fs' // node lib - filesystem
import convert from 'xml-js' // https://github.com/nashwaan/xml-js
import * as libapp from './libapp.js'

const path = 'services/application/examples/mazak/5717sm.xml'
const xml = fs.readFileSync(path).toString()
const json = JSON.parse(convert.xml2json(xml, { compact: true }))
// console.log(json)
// libapp.print(json)

const nodes = []
const edges = []

function addNode(node) {
  nodes.push(node)
}
function addEdge(edge) {
  edges.push(edge)
}

libapp.traverse(json, addNode, addEdge)

console.log(nodes)
console.log(edges)

const nodesFile = 'nodes.json'
fs.writeFileSync(nodesFile, JSON.stringify(nodes, null, 2))

const edgesFile = 'edges.json'
fs.writeFileSync(edgesFile, JSON.stringify(edges, null, 2))
