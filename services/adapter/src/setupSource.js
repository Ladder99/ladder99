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
  params,
  source,
  cache,
  client,
  devices,
  device,
  connections,
}) {
  //
  // console.log(`source`, source) // don't print - might have password etc
  const { module, driver, protocol, host, port } = source

  // import driver plugin, eg micro.js or mqtt-subscriber.js.
  // this instantiates a new instance of the AdapterDriver class.
  const plugin = await getPlugin(params.driversFolder, driver)
  source.plugin = plugin // save to source so on agent connection can tell it socket

  // get input handlers, if any for this source
  // these are interpreted by the driver
  const pathInputs = `${params.modulesFolder}/${module}/inputs.yaml`
  console.log(`Adapter reading ${pathInputs}...`)
  const inputs = lib.importYaml(pathInputs) || {}

  // get output handlers
  // output yamls should all follow the same format, unlike input yamls.
  const pathOutputs = `${params.modulesFolder}/${module}/outputs.yaml`
  console.log(`Adapter reading ${pathOutputs}...`)
  const outputTemplates = (lib.importYaml(pathOutputs) || {}).outputs

  // get types, if any
  const pathTypes = `${params.modulesFolder}/${module}/types.yaml`
  console.log(`Adapter reading ${pathTypes}...`)
  const types = (lib.importYaml(pathTypes) || {}).types

  if (outputTemplates) {
    // compile value js strings from outputs.yaml.
    // source.outputs is array of {key: string, value: function, dependsOn: string[]}.
    // eg [{ key: 'ac1-power_condition', value: 'FAULT', dependsOn: ['ac1-power_fault', 'ac1-power_warning'] }, ...]
    // save those outputs onto the source object, so can call setSocket later.
    source.outputs = getOutputs({
      templates: outputTemplates,
      types,
      deviceId: device.id,
    })

    // add outputs for each source to cache.
    // these are not fully functional until we call cache.setSocket.
    // used to pass socket in here, but need to handle agent reconnection.
    cache.addOutputs(source.outputs)
  }

  // iterate over input handlers, if any
  const handlers = Object.values(inputs.handlers || [])
  for (let handler of handlers) {
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

  // initialize driver plugin
  // note: this must be done AFTER getOutputs and addOutputs,
  // as that is where the dependsOn values are set, and this needs those.
  //. add eg for each param
  console.log(`Adapter initializing driver for ${driver}...`)
  plugin.init({
    //. simpler/better to pass the whole source object here, in case has weird stuff in it.
    //. so - remove all the source subobjects below, and update all the drivers.
    source,

    client,
    device,
    driver, // eg 'random'

    // pass whole drivers array here also, in case driver needs to know other devices?
    // eg for jobboss - needs to know what workcenters/devices to look for.
    devices,

    //. consolidate these into a connect object
    protocol,
    host,
    port,

    cache,
    inputs,
    types,
    // connection,
    connections,
  })

  // //. load feedbackjs if specified in setup.yaml and start it
  // const feedback = source.feedback
  // if (feedback) {
  //   // import driver plugin
  //   const plugin = await getPlugin(params.driversFolder, 'feedback.js')
  //   //. how send it the mqtt-provider instance? or can it just import it?
  //   plugin.init({ feedback, cache, host, port })
  // }
}
