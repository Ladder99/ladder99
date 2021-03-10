const fs = require('fs') // node lib
const yaml = require('js-yaml') // https://github.com/nodeca/js-yaml
const convert = require('xml-js') // https://github.com/nashwaan/xml-js

try {
  const doc = yaml.load(fs.readFileSync('../config/devices.yaml', 'utf8'))
  console.log(doc)
  const js = {
    _declaration: {
      _attributes: {
        version: '1.0',
        encoding: 'UTF-8',
      },
    },
    // <MTConnectDevices
    //   xmlns:m = "urn:mtconnect.org:MTConnectDevices:1.6"
    //   xmlns:xsi = "http://www.w3.org/2001/XMLSchema-instance"
    //   xmlns="urn:mtconnect.org:MTConnectDevices:1.6"
    //   xsi:schemaLocation = "urn:mtconnect.org:MTConnectDevices:1.6 http://www.mtconnect.org/schemas/MTConnectDevices_1.6.xsd"
    //  >
    // element: [{ _attributes: { x: 2 } }],
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
      },
    ],
  }

  const xml = convert.js2xml(js, { compact: true, spaces: 2 })
  console.log(xml)
} catch (e) {
  console.log(e)
}

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
// console.log(xmlString)
