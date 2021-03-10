const fs = require('fs') // node lib
const yaml = require('js-yaml') // https://github.com/nodeca/js-yaml
const convert = require('xml-js') // https://github.com/nashwaan/xml-js

try {
  const doc = yaml.load(fs.readFileSync('../config/devices.yaml', 'utf8'))
  console.log(doc)
} catch (e) {
  console.log(e)
}

const js = { attributes: { x: 3 }, text: 'pokpok', elements: [] }
const xml = convert.js2xml(js)
console.log({ xml })

const input = {
  _xmlDeclaration: {
    _attr: {
      version: '1.0',
      encoding: 'UTF-8',
      standalone: 'no',
    },
  },
  data: { foo: 'bar' },
}

const xmlString = convert.js2xml(input, {
  compact: true,
  attributesKey: '_attr',
  declarationKey: '_xmlDeclaration',
})

// <?xml version="1.0" encoding="UTF-8" standalone="no"?><data><foo>bar</foo></data>
console.log(xmlString)
