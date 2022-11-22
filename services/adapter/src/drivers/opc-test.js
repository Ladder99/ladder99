// run this with `node opc-test.js`
// have kepware running on localhost:49320
// note: must use 127.0.0.1, not localhost, for the connection to work

import { AdapterDriver } from './opc.js'

const driver = new AdapterDriver()

driver.start({
  device: { id: 'opc' },
  cache: {
    set: (key, value) => {
      console.log('cache.set', key, value)
    },
  },
  source: { connect: { url: 'opc.tcp://127.0.0.1:49320' } },
  schema: {
    inputs: {
      inputs: [
        { key: 'words', nodeId: 'ns=2;s=Simulation Examples.Functions.User1' },
        { key: 'values', nodeId: 'ns=2;s=Simulation Examples.Functions.User2' },
      ],
    },
  },
})
