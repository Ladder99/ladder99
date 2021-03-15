// translate device.yaml files to devices.xml

const fs = require('fs') // node lib filesys
const yaml = require('js-yaml') // https://github.com/nodeca/js-yaml
const convert = require('xml-js') // https://github.com/nashwaan/xml-js

const sourcefiles = process.argv.slice(2) // eg ['input/foo/device.yaml']

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
        //. values?
        _attributes: {
          creationTime: '2021-02-23T18:44:40+00:00',
          sender: 'localhost',
          instanceId: '1267728234',
          bufferSize: '131072',
          version: '1.6.0.7',
        },
      },
      Devices: {
        Device: null, // attach devices here
      },
    },
  ],
}

// treat these yaml elements as attributes
const attributesSet = getSet(`
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
`)

// enclose these yaml elements as contents
const valuesSet = getSet(`
text
source
`)

// hide these yaml elements
const hiddenSet = getSet(`
events
docs
javascript
`)

// helper fns

// get list of devices from device.yaml files
function getDevices() {
  const devices = []
  for (const sourcefile of sourcefiles) {
    const ystr = fs.readFileSync(sourcefile, 'utf8')
    const ytree = yaml.load(ystr) // parse yaml
    const xtree = translate(ytree) // recurses
    const device = xtree.Device[0]
    devices.push(device)
  }
  return devices
}

// translate yaml tree to xml tree recursively
function translate(ytree) {
  if (Array.isArray(ytree)) {
    return ytree.map(el => translate(el))
  } else if (typeof ytree === 'object') {
    const obj = {}
    const attributes = {}
    const elements = {}
    const keys = Object.keys(ytree)
    for (const key of keys) {
      const el = ytree[key]
      if (attributesSet.has(key)) {
        attributes[key] = el
      } else if (valuesSet.has(key)) {
        obj._text = el
      } else if (hiddenSet.has(key)) {
        // ignore
      } else {
        const element = translate(el)
        elements[capitalize(key)] = element
      }
    }
    return { _attributes: attributes, ...elements, ...obj }
  } else {
    return null
  }
}

function capitalize(str) {
  return str.slice(0, 1).toUpperCase() + str.slice(1)
}

function getSet(lines) {
  return new Set(lines.trim().split('\n'))
}

// ----------------

function main() {
  const devices = getDevices()
  xdoc.MTConnectDevices[0].Devices.Device = devices
  const xstr = convert.js2xml(xdoc, { compact: true, spaces: 2 })
  console.log(xstr)
}

main()
