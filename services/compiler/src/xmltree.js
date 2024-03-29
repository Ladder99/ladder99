// define xml tree root
// this is in a format the xml-js lib understands
export default {
  _declaration: {
    _attributes: { version: '1.0', encoding: 'UTF-8' },
  },
  _comment: 'Generated file - DO NOT EDIT!',
  MTConnectDevices: [
    {
      _attributes: {
        'xmlns:m': 'urn:mtconnect.org:MTConnectDevices:1.7',
        'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
        xmlns: 'urn:mtconnect.org:MTConnectDevices:1.7',
        'xsi:schemaLocation':
          'urn:mtconnect.org:MTConnectDevices:1.7 http://www.mtconnect.org/schemas/MTConnectDevices_1.7.xsd',
      },
      Header: {
        //. values?
        _attributes: {
          creationTime: '2021-02-23T18:44:40+00:00', //.
          sender: 'localhost', //.
          instanceId: '12345678', //.
          bufferSize: '131072', //. ?
          version: '1.7.0.3', //.
        },
      },
      Devices: {
        Device: null, // attach devices here
      },
    },
  ],
}
