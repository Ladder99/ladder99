import { AdapterDriver } from './opc.js'

const driver = new AdapterDriver()
driver.init({
  device: {},
  cache: { set: () => {} },
  // source: { connect: { url: 'opc.tcp://localhost:4840' } },
  source: { connect: { url: 'opc.tcp://localhost:49320' } },
})
