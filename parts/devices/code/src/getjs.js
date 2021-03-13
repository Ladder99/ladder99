// build js from code entries in the yaml trees

const fs = require('fs') // node lib filesys
const yaml = require('js-yaml') // https://github.com/nodeca/js-yaml

const sourcefile = process.argv[2] // eg 'input/device-foo.yaml'

function main() {
  // read yaml string
  const ystr = fs.readFileSync(sourcefile, 'utf8')
  // convert to yaml tree
  const ytree = yaml.load(ystr)
  // console.dir(ytree, { depth: null })
  // console.log('---')
  // let arr = []
  // getCode(ytree, arr)
  // const js = arr.join('\n')
  const dict = {}
  getCode(ytree, dict)
  const js = Object.values(dict).join('\n')
  console.log(js)
}

// find all code entries and extract as string
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
      } else if (key === 'javascript') {
        dict[id] = el
      } else {
        getCode(el, dict)
      }
    }
  } else {
    // ignore atoms
  }
}

main()
