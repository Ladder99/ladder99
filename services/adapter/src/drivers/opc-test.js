import { AdapterDriver } from './opc.js'

const driver = new AdapterDriver()
driver.init({
  device: {},
  cache: { set: () => {} },
  source: { connect: { url: 'opc.tcp://127.0.0.1:49320' } },
})
