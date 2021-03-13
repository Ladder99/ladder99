// build js from code entries in the yaml trees

const fs = require('fs') // node lib filesys
const yaml = require('js-yaml') // https://github.com/nodeca/js-yaml

const sourcefile = process.argv[2] // eg 'input/device-foo.yaml'

function main() {
  // read yaml string
  const ystr = fs.readFileSync(sourcefile, 'utf8')
  // convert to yaml tree
  const ytree = yaml.load(ystr)
  console.dir(ytree, { depth: null })
  // const s = flatten(arr).join('')
  // extract js
  // const js = getCode(ytree)
  // console.log(js)
}

// // find all code entries and extract as string
// function getCode(ytree) {
//   if (Array.isArray(ytree)) {
//     return ytree.map(el => getCode(el))
//   } else if (typeof ytree === 'object') {
//     const elements = []
//     const keys = Object.keys(ytree)
//     for (const key of keys) {
//       const el = ytree[key]
//       if (key === 'javascript') {
//         elements.push({ key, el })
//       } else {
//         const element = getCode(el)
//         elements.push(element)
//       }
//     }
//     return elements
//   } else {
//     return ytree
//   }
// }

main()
