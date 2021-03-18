// build js from code 'value' entries in a yaml tree

const fs = require('fs') // node lib filesys
const yaml = require('js-yaml') // https://github.com/nodeca/js-yaml

const sourcefile = process.argv[2] // eg 'input/foo/device.yaml'

// find all value entries in the yaml tree and add as strings to output dict, recursively.
// note: js entries can be duplicated because they might appear as references,
// so need to use a dict to key on the element id.
function getCode(ytree, dict) {
  if (Array.isArray(ytree)) {
    for (const el of ytree) {
      getCode(el, dict)
    }
  } else if (typeof ytree === 'object') {
    const keys = Object.keys(ytree)
    let id
    for (const key of keys) {
      const el = ytree[key]
      if (key === 'id') {
        id = key
      } else if (key === 'value') {
        dict[id] = el
      } else {
        getCode(el, dict)
      }
    }
  } else {
    // ignore atoms
  }
}

// ----------------

function main() {
  const ystr = fs.readFileSync(sourcefile, 'utf8')
  const ytree = yaml.load(ystr) // parse yaml
  // console.dir(ytree, { depth: null })
  const dict = {}
  getCode(ytree, dict)
  const js = Object.values(dict).join('\n')
  console.log(js)
}

main()
