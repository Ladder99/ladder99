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
  source: { connect: { host: '192.168.2.249', port: 502 } }, // for cct test
  schema: {
    inputs: {
      inputs: [
        { key: 'status', address: 2100 },
        { key: 'fault', address: 2101 },
        { key: 'warn', address: 2102 },
        { key: 'nlanes', address: 3000 },
        { key: 'l1-pcall', address: 5000, datatype: 'uint32' },
        { key: 'l2-pcall', address: 5002, datatype: 'uint32' },
        { key: 'l3-pcall', address: 5002, datatype: 'uint32' },
        { key: 'l4-pcall', address: 5002, datatype: 'uint32' },
        { key: 'l1-pcgood', address: 5008, datatype: 'uint32' },
        { key: 'l2-pcgood', address: 5010, datatype: 'uint32' },
        { key: 'l3-pcgood', address: 5012, datatype: 'uint32' },
        { key: 'l4-pcgood', address: 5014, datatype: 'uint32' },
        { key: 'l1-pcbad', address: 5016, datatype: 'uint32' },
        { key: 'l2-pcbad', address: 5018, datatype: 'uint32' },
        { key: 'l3-pcbad', address: 5020, datatype: 'uint32' },
        { key: 'l4-pcbad', address: 5022, datatype: 'uint32' },
        { key: 'l1-pcfailed', address: 5024, datatype: 'uint32' },
        { key: 'l2-pcfailed', address: 5026, datatype: 'uint32' },
        { key: 'l3-pcfailed', address: 5028, datatype: 'uint32' },
        { key: 'l4-pcfailed', address: 5030, datatype: 'uint32' }
      ],
    },
  },
})
