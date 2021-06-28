import fs from 'fs' // node lib - filesystem
import convert from 'xml-js' // https://github.com/nashwaan/xml-js
import * as libapp from './libapp.js'

const path = 'services/application/examples/mazak/5717sm.xml'
const xml = fs.readFileSync(path).toString()
const json = JSON.parse(convert.xml2json(xml, { compact: true }))
// console.log(json)
libapp.print(json)
exit()
traverse(json, callback)
function callback(obj) {
  console.log(obj)
}

function traverse(node, callback, parentTag = null) {
  if (libapp.isObject(node)) {
    const keys = Object.keys(node)
    for (const key of keys) {
      const value = node[key]
      if (key === '_declaration') {
        continue
      } else if (key === '_attributes') {
        const obj = { tag: parentTag, ...value }
        callback(obj)
        // console.log(obj)
      } else {
        traverse(value, callback, key)
      }
    }
  } else if (Array.isArray(node)) {
  } else {
  }
}
