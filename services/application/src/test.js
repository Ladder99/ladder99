import fs from 'fs' // node lib - filesystem
import crypto from 'crypto' // node lib
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
traverse(json, addNode, addEdge)
console.log(nodes)
console.log(edges)

function traverse(node, addNode, addEdge, parentTag = 'root', parentKey = '') {
  if (libapp.isObject(node)) {
    const keys = Object.keys(node)
    // assign random key to each node, use to define edges
    const _key = crypto.randomBytes(8).toString('hex')
    let obj = { tag: parentTag, _key }
    for (const key of keys) {
      const value = node[key]
      if (key === '_declaration') {
      } else if (key === '_attributes') {
        obj = { ...obj, ...value }
      } else if (key === '_text') {
        obj = { ...obj, value }
      } else {
        traverse(value, addNode, addEdge, key, _key)
      }
    }
    addNode(obj)
    if (parentKey) {
      addEdge({ _from: parentKey, _to: _key })
    }
  } else if (Array.isArray(node)) {
    for (const el of node) {
      traverse(el, addNode, addEdge, parentTag, parentKey)
    }
  } else {
    console.log('>>what is this?', { node })
  }
}
