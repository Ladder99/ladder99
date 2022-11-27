// adapter
// poll or subscribe to data via plugins, update cache,
// update shdr strings, pass them to agent via tcp.

import * as lib from './common/lib.js'
import { Cache } from './cache.js'
import { setupDevice } from './setupDevice.js'
import { getPlugin } from './helpers.js'

export class Adapter {
  //
  async start(params) {
    //
    // read client setup.yaml file
    const setup = lib.readSetup(params.setupFolder)

    // define cache shared across all devices and sources
    const cache = new Cache()

    // load any shared providers
    // eg setup.yaml/adapter/providers = { sharedMqtt: { driver, url }, ... }
    const providers = setup.adapter?.providers ?? {}
    for (const provider of Object.values(providers)) {
      console.log(`Adapter get shared provider`, provider)
      // import driver plugin - instantiates a new instance of the AdapterDriver class
      const plugin = await getPlugin(params.driversFolder, provider.driver) // eg 'mqttProvider'
      plugin.start({ provider }) // start driver - eg this connects to the mqtt broker
      provider.plugin = plugin // save plugin to this provider object, eg { driver, url, plugin }
    }

    // iterate over device definitions from setup.yaml file and do setup for each
    //. create Device instance for each, call start method on them
    const client = setup.client ?? {}
    const devices = setup?.adapter?.devices ?? []
    for (const device of devices) {
      setupDevice({ setup, params, device, cache, client, devices, providers })
    }
  }

  // send stop message to all devices
  stop() {
    // for (let device of this.devices) {
    //   device.stop()
    // }
  }
}
