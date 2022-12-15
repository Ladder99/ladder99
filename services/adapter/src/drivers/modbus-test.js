// run this with
//   cd ladder99/services/adapter
//   npm install
//   cd src/drivers
//   node modbus-test.js

import { AdapterDriver } from './modbus.js'

const driver = new AdapterDriver()

driver.start({
  device: { id: 'mb' },
  cache: {
    set: (key, value) => {
      console.log('cache.set', key, value)
    },
  },
  // source: { connect: { host: '10.1.10.130', port: 502 } },
  // source: { connect: { host: '10.1.10.131', port: 502 } },
  // source: { connect: { host: '10.1.10.132', port: 502 } },
  // source: { connect: { host: '10.1.10.130', port: 5021 } }, // no such port
  // source: { connect: { host: '10.1.10.250', port: 502 } }, // no such host
  source: { connect: { host: '192.168.2.250', port: 502 } }, // for cct test
  schema: {},
})
