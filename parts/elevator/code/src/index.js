const fs = require('fs') // node lib
const yaml = require('js-yaml') // https://github.com/nodeca/js-yaml
const convert = require('xml-js') // https://github.com/nashwaan/xml-js

try {
  const doc = yaml.load(fs.readFileSync('../config/devices.yaml', 'utf8'))
  console.log(doc)
} catch (e) {
  console.log(e)
}

const input = {
  _declaration: {
    _attributes: {
      version: '1.0',
      encoding: 'UTF-8',
    },
  },
  element: [{ _attributes: { x: 2 } }],
}
const xmlString = convert.js2xml(input, {
  compact: true,
})

// const input = {
//   declaration: {
//     attributes: {
//       version: '1.0',
//       encoding: 'UTF-8',
//     },
//   },
//   elements: [
//     { instruction: 'ljjj', name: 'lkm', type: 'element', attributes: { x: 2 } },
//   ],
// }
// const xmlString = convert.js2xml(input)

// <?xml version="1.0" encoding="UTF-8"?><data><foo>bar</foo></data>
console.log(xmlString)
