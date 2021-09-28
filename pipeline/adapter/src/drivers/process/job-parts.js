// job-parts driver
// handles processes with jobs that have parts - calculate cycle times etc

// import libmqtt from 'mqtt' // see https://www.npmjs.com/package/mqtt
import { v4 as uuid } from 'uuid' // see https://github.com/uuidjs/uuid - may be used by inputs/outputs yaml js
import { AdapterDriver as MqttJson } from '../mqtt-json.js'

export class AdapterDriver {
  // initialize the client plugin

  // queries the device for address space definitions, subscribes to topics.
  // inputs is the inputs.yaml file parsed to a js tree.
  // note: types IS used - by the part(cache, $) fn evaluation
  init({ deviceId, deviceName, host, port, cache, inputs, types }) {
    console.log('Initializing job-parts driver for', { deviceId })

    const mqttJson = new MqttJson()

    const handlers = {}

    //. pass handler fns here? then inject them at certain points given conditions?
    mqttJson.init({
      deviceId,
      deviceName,
      host,
      port,
      cache,
      inputs,
      types,
      handlers,
    })
  }
}
