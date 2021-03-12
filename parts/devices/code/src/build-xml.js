// translate yaml device files to devices.xml

const fs = require('fs') // node lib
const yaml = require('js-yaml') // https://github.com/nodeca/js-yaml
const convert = require('xml-js') // https://github.com/nashwaan/xml-js

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

// get devices from yaml files
function getDevices(sourcefiles) {
  const devices = []
  for (const sourcefile of sourcefiles) {
    // read yaml string
    const ystr = fs.readFileSync(sourcefile, 'utf8')

    // convert to yaml tree
    const ytree = yaml.load(ystr)

    // walk yaml tree and translate elements to xml tree recursively
    const xtree = translate(ytree)

    // extract the device and add to list
    const xdevice = xtree.Device[0]
    devices.push(xdevice)
  }
  return devices
}

function main(sourcefiles) {
  try {
    // get devices and attach to xml tree
    const devices = getDevices(sourcefiles)
    xdoc.MTConnectDevices[0].Devices.Device = devices

    // convert xml tree to string and output
    const xstr = convert.js2xml(xdoc, { compact: true, spaces: 2 })
    console.log(xstr)
    return 0
  } catch (e) {
    console.error(e)
    return 1
  }
}

// helper fns

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

function getSet(str) {
  return new Set(str.trim().split('\n'))
}

module.exports = main
