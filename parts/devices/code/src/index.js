// elevator
// translate yaml device files to devices.xml

const fs = require('fs') // node lib
const yaml = require('js-yaml') // https://github.com/nodeca/js-yaml
const convert = require('xml-js') // https://github.com/nashwaan/xml-js

const sourcefiles = process.argv.slice(2) // eg ['config/device-ccs-pa.yaml']

const attributes = `
id
name
nativeName
uuid
sampleInterval
manufacturer
model
serialNumber
category
type
subType
`
const attributesSet = new Set(attributes.trim().split('\n'))

const values = `
text
source
`
const valuesSet = new Set(values.trim().split('\n'))

const hiddenSet = new Set('events'.split(','))

const devices = []

for (const sourcefile of sourcefiles) {
  // read yaml
  const ystr = fs.readFileSync(sourcefile, 'utf8')

  // convert yaml to js tree
  const ydoc = yaml.load(ystr)

  // walk yaml tree and translate elements to xml tree recursively
  const device = translate(ydoc['devices'])

  devices.push(device)
}

// define xml document root
const xdoc = {
  _declaration: {
    _attributes: { version: '1.0', encoding: 'UTF-8' },
  },
  MTConnectDevices: [
    {
      _attributes: {
        'xmlns:m': 'urn:mtconnect.org:MTConnectDevices:1.6',
        'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
        xmlns: 'urn:mtconnect.org:MTConnectDevices:1.6',
        'xsi:schemaLocation':
          'urn:mtconnect.org:MTConnectDevices:1.6 http://www.mtconnect.org/schemas/MTConnectDevices_1.6.xsd',
      },
      Header: {
        _attributes: {
          creationTime: '2021-02-23T18:44:40+00:00',
          sender: 'localhost',
          instanceId: '1267728234',
          bufferSize: '131072',
          version: '1.6.0.7',
        },
      },
      // attach devices here
      Devices: devices,
    },
  ],
}

// convert xml tree to string
const xstr = convert.js2xml(xdoc, { compact: true, spaces: 2 })
console.log(xstr)

// helpers

// translate yaml tree to xml tree recursively
function translate(ytree) {
  if (Array.isArray(ytree)) {
    return ytree.map(el => translate(el))
  } else if (typeof ytree === 'object') {
    const obj = {}
    const attrs = {}
    const elements = {}
    const keys = Object.keys(ytree)
    for (const key of keys) {
      const el = ytree[key]
      if (attributesSet.has(key)) {
        attrs[key] = el
      } else if (valuesSet.has(key)) {
        obj._text = el
      } else if (hiddenSet.has(key)) {
        //
      } else {
        const element = translate(el)
        elements[capitalize(key)] = element
      }
    }
    return { _attributes: attrs, ...elements, ...obj }
  } else {
    return null
  }
}

function capitalize(str) {
  return str.slice(0, 1).toUpperCase() + str.slice(1)
}
