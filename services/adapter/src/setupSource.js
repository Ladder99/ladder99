// setup a device source
// load and initialize any plugin/driver code

import * as lib from './common/lib.js'
import {
  getOutputs,
  getPlugin,
  getMacros,
  compileExpressions,
} from './helpers.js'

export async function setupSource({
  setup,
  params,
  source, // eg { module, driver, connection } - connection could be a string for a shared connection name, or { host, port }, or { url }
  cache,
  client,
  devices,
  device,
  providers, // shared connections, eg an MqttProvider
}) {
  //
  // don't print full source - might have db password!
  console.log(`Adapter setup source`, device.name, source.module, source.driver)
  const { driver, connection } = source
  const moduleName = source.module

  // module could be eg 'cutter' for box cutters
  //. allow custom modules per setup, eg add module to setup-oxbox folder

  // import driver plugin, eg micro.js or mqttSubscriber.js.
  // this instantiates a new instance of the AdapterDriver class.
  // but doesn't start the plugin! that's at the end of this code.
  const plugin = await getPlugin(params.driversFolder, driver)
  source.plugin = plugin // save to source so on agent connection can tell it socket

  // create a module object for the yaml file contents - inputs.yaml, outputs.yaml, types.yaml
  const module = {}

  if (moduleName) {
    // get input handlers, if any for this source
    // these are interpreted by the driver
    const pathInputs = `${params.modulesFolder}/${moduleName}/inputs.yaml`
    console.log(`Adapter reading ${pathInputs}...`)
    module.inputs = lib.importYaml(pathInputs) || {}

    // get output handlers
    // output yamls should all follow the same format, unlike input yamls.
    const pathOutputs = `${params.modulesFolder}/${moduleName}/outputs.yaml`
    console.log(`Adapter reading ${pathOutputs}...`)
    module.outputs = (lib.importYaml(pathOutputs) || {}).outputs

    // get types, if any
    const pathTypes = `${params.modulesFolder}/${moduleName}/types.yaml`
    console.log(`Adapter reading ${pathTypes}...`)
    module.types = (lib.importYaml(pathTypes) || {}).types
  }

  if (module.outputs) {
    console.log(`Adapter adding outputs to cache for ${device.name}...`)
    // compile value js strings from outputs.yaml.
    // source.outputs is array of {key: string, value: function, dependsOn: string[]}.
    // eg [{ key: 'ac1-power_condition', value: 'FAULT', dependsOn: ['ac1-power_fault', 'ac1-power_warning'] }, ...]
    // save those outputs onto the source object, so can call setSocket later.
    source.outputs = getOutputs({
      templates: module.outputs,
      types: module.types,
      deviceId: device.id,
    })

    // for each source we need to add the outputs to cache.
    // these are not fully functional until we call cache.setSocket.
    // used to pass socket in here, but need to handle agent reconnection also.
    cache.addOutputs(source.outputs)
  }

  // iterate over input handlers in inputs.yaml, if any -
  // handlers is eg { 'controller': { text, initialize, lookup, algorithm, expressions, accessor }, ... }
  // the key is the message topic, eg 'controller'.
  const handlers = module.inputs?.handlers || {}
  for (let handlerKey of Object.keys(handlers)) {
    console.log(`Adapter processing inputs for`, handlerKey) // eg 'controller'

    const handler = handlers[handlerKey] // eg { initialize, algorithm, lookup, expressions, accessor, ... }

    // get macros (regexs to extract references from code)
    const prefix = device.id + '-'
    const macros = getMacros(prefix, handler.accessor)

    // parse input handler code, get dependency graph, compile fns
    // eg maps could be { addr: { '%Z61.0': Set{ 'has_current_job' } }, ...}
    // use like
    //   const keys = [...maps.addr['%Z61.0']] // = ['has_current_job', 'foo_bar']
    // so can know what formulas need to be evaluated for some given addr
    const { augmentedExpressions, maps } = compileExpressions(
      handler.expressions,
      macros
    )
    handler.augmentedExpressions = augmentedExpressions
    handler.maps = maps

    // get set of '=' exprs to always run
    handler.alwaysRun = new Set()
    for (let key of Object.keys(augmentedExpressions)) {
      const expr = augmentedExpressions[key]
      if (expr.always) {
        handler.alwaysRun.add(key)
      }
    }
  }

  // get any shared provider here and pass down.
  // eg an mqtt provider that dispatches to mqtt subscribers.
  // connection could be a string for a shared provider name or an object { host, port } etc.
  //. currently just handles string.
  //. if connection is an object eg { host, port }, just pass that to the driver and let it handle it.
  // note: the mqttProvider object has same api as libmqtt's object, just extended a little bit.
  let provider
  if (typeof connection === 'string') {
    console.log('Adapter getting provider for', device.name, connection)
    provider = providers[connection]?.plugin // get shared connection - eg an MqttProvider instance
    if (!provider) {
      console.log(
        `Adapter error unknown provider connection`,
        device.name,
        connection
      )
      process.exit(1)
    }
  }

  // finally, start the driver plugin.
  // note: this must be done AFTER getOutputs and addOutputs,
  // as that is where the dependsOn values are set, and this needs those.
  //. add example for each param
  console.log(`Adapter starting driver for`, device.name, driver)
  plugin.start({
    setup, // the main setup.yaml file contents

    //. simpler/better to pass the whole source object here, in case has weird stuff in it.
    //. so - remove all the source subobjects below, and update all the drivers.
    source, // the whole source tree, eg { module, driver, connection, ... }

    client, // eg { name, timezone } defined at top of setup.yaml
    device, // eg { id, name, sources, ... }
    driver, // eg 'mqttSubscriber' - maps to 'drivers/mqttSubscriber.js'

    // pass whole drivers array here, in case driver needs to know other devices.
    // eg jobboss driver needs to know what workcenters/devices to look for.
    devices,

    cache, // the shared cache object

    moduleName, // eg 'cutter', 'feedback'
    module, // { inputs, outputs, types }

    providers, // shared input connections defined at top of setup.yaml, if any
    connection, // a shared connection name, or { host, port }, etc - eg 'mqttProvider'
    provider, // a shared provider object, if any
  })
}
