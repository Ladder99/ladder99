// run this with `node modbus-test.js`

import { AdapterDriver } from './modbus.js'

const driver = new AdapterDriver()

driver.start({
  device: { id: 'modbus' },
  cache: {
    set: (key, value) => {
      console.log('cache.set', key, value)
    },
  },
  source: { connect: { url: '10.1.10.130' } },
  schema: {},
})
