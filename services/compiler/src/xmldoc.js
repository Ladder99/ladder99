// define xml document root
export default {
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
          creationTime: '2021-02-23T18:44:40+00:00', //.
          sender: 'localhost', //.
          instanceId: '12345678', //.
          bufferSize: '131072', //. ?
          version: '1.6.0.7', //.
        },
      },
      Devices: {
        Device: null, // attach devices here
      },
    },
  ],
}
