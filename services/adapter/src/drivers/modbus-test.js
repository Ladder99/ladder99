// run this with `node modbus-test.js`

import { AdapterDriver } from './modbus.js'

const driver = new AdapterDriver()

driver.start({
  device: { id: 'mb' },
  cache: {
    set: (key, value) => {
      console.log('cache.set', key, value)
    },
  },
  source: { connect: { host: '10.1.10.130', port: 502 } },
  // source: { connect: { host: '10.1.10.131', port: 502 } },
  // source: { connect: { host: '10.1.10.132', port: 502 } },
  // source: { connect: { host: '10.1.10.130', port: 5021 } }, // no such port
  // source: { connect: { host: '10.1.10.139', port: 502 } }, // no such host
  schema: {},
})
