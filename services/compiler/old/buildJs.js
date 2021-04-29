// build js from code 'value' entries in a yaml tree

const fs = require('fs') // node lib filesys
const yaml = require('js-yaml') // https://github.com/nodeca/js-yaml

const sourcefile = process.argv[2] // eg 'input/foo/device.yaml'

// find all value entries in the yaml tree and add as strings to output dict, recursively.
function getCode(ytree, values) {
  if (Array.isArray(ytree)) {
    ytree.forEach(el => getCode(el, values))
  } else if (typeof ytree === 'object') {
    const keys = Object.keys(ytree)
    let id
    for (const key of keys) {
      const el = ytree[key]
      if (key === 'id') {
        id = key
      } else if (key === 'value') {
        // dict[id] = el
        values.push(el)
      } else {
        getCode(el, values)
      }
    }
  } else {
    // ignore atoms
  }
}

// ----------------

const yamlStr = fs.readFileSync(sourcefile, 'utf8')
const yamlTree = yaml.load(yamlStr) // parse
// console.dir(yamlTree, { depth: null })
const values = []
getCode(yamlTree, values)
const jsStr = values.join('\n')
console.log(jsStr)
