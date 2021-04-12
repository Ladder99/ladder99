// translate devices.yaml to devices.xml

import fs from 'fs' // node lib filesys
import libyaml from 'js-yaml' // https://github.com/nodeca/js-yaml
import libxml from 'xml-js' // https://github.com/nashwaan/xml-js
import sets from './sets.js'

const sourcefile = process.argv[2] // eg 'setups/demo/devices.yaml'

// define xml document root
const xmldoc = {
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

// helper fns

// get list of devices from devices.yaml
function getDevices() {
  // const devices = []
  const yaml = fs.readFileSync(sourcefile, 'utf8')
  const yamltree = libyaml.load(yaml) // parse yaml
  console.log(yamltree)
  const devices = yamltree.devices
  // for (const sourcefile of sourcefiles) {
  //   const xmltree = translate(yamltree) // recurses
  //   const device = xmltree.Device[0]
  //   devices.push(device)
  // }
  return devices
}

// translate yaml tree to xml tree recursively
function translate(yamltree) {
  if (Array.isArray(yamltree)) {
    return yamltree.map(el => translate(el))
  } else if (typeof yamltree === 'object') {
    const obj = {}
    const attributes = {}
    const elements = {}
    const keys = Object.keys(yamltree)
    for (const key of keys) {
      const el = yamltree[key]
      if (sets.attributes.has(key)) {
        attributes[key] = el
      } else if (sets.values.has(key)) {
        obj._text = el
      } else if (sets.hidden.has(key)) {
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

// ----------------

function main() {
  const devices = getDevices()
  xmldoc.MTConnectDevices[0].Devices.Device = devices
  const xml = libxml.js2xml(xmldoc, { compact: true, spaces: 2 })
  //. insert comment at/near top -
  // <!-- generated file - do not edit -->
  console.log(xml)
}

main()
