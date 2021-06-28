import fs from 'fs' // node lib - filesystem
import convert from 'xml-js' // https://github.com/nashwaan/xml-js
import * as libapp from './libapp.js'

const path = 'services/application/examples/mazak/5717sm.xml'
const xml = fs.readFileSync(path).toString()
const json = JSON.parse(convert.xml2json(xml, { compact: true }))
// console.log(json)
// libapp.print(json)

const objs = []
function callback(obj) {
  objs.push(obj)
}
traverse(json, callback)
console.log(objs)

function traverse(node, callback, parentTag = null) {
  if (libapp.isObject(node)) {
    const keys = Object.keys(node)
    let obj = { tag: parentTag }
    for (const key of keys) {
      const value = node[key]
      if (key === '_declaration') {
        obj.tag = 'Xml'
      } else if (key === '_attributes') {
        obj = { ...obj, ...value }
      } else if (key === '_text') {
        obj = { ...obj, value }
      } else {
        traverse(value, callback, key)
      }
    }
    callback(obj)
  } else if (Array.isArray(node)) {
    for (const el of node) {
      traverse(el, callback, parentTag)
    }
  } else {
    console.log({ node })
  }
}
