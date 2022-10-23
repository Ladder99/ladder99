import { AdapterDriver } from './opc.js'

const driver = new AdapterDriver()
driver.start({
  device: { id: 'opc' },
  cache: {
    set: (key, value) => {
      console.log('cache.set', key, value)
    },
  },
  source: { outputs: { agent: { url: 'opc.tcp://127.0.0.1:49320' } } },
  module: {
    inputs: [
      { key: 'words', nodeId: 'ns=2;s=Simulation Examples.Functions.User1' },
      { key: 'values', nodeId: 'ns=2;s=Simulation Examples.Functions.User2' },
    ],
  },
})
