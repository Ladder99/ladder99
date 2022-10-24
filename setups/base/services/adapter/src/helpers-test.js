// test helper fns
// usage:
//   cd services/adapter
//   node src/helpers-test.js

import * as helpers from './helpers.js'
import * as lib from './common/lib.js'

// ~inputs.yaml
const inputs = {
  handlers: {
    'l99/ccs/foo': {
      accessor: 'value',
      expressions: {
        has_current_job: "=!!$['%Z61.0']",
        job_meta: "msg('%Z61.0')",
        carton_quantity: '(<job_meta> || {}).carton_quantity',
        job_complete: "=msg('%Z61.22') === true",
      },
    },
  },
}

// ~cache class object
const cache = {}

const deviceId = 'pr1'
const prefix = deviceId + '-'

// ~mqtt message payloads
const payloads = [
  [{ address: '%Z61.0', value: { carton_quantity: 5 } }], // job meta
  [{ address: '%Z61.22', value: true }], // job complete
  [{ address: '%Z61.22', value: true }], // job complete - duplicate, shouldn't trigger any exprs
  [{ address: '%Z61.0', value: { carton_quantity: 1 } }], // job meta
  [{ address: '%Z61.22', value: true }], // job complete
]

// let last$ = {}

for (let payload of payloads) {
  console.log('payload', payload)
  //
  // initialize $ dictionary
  // ie from initialize: 'payload.forEach(item => $[item.address] = item)'
  const $ = {}
  payload.forEach(item => ($[item.address] = item))

  // compile inputs yaml
  const handler = inputs.handlers['l99/ccs/foo']
  const macros = helpers.getMacros(prefix, handler.accessor)
  const { augmentedExpressions, maps } = helpers.compileExpressions(
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

  // get set of keys for eqns we need to execute
  const equationKeys = helpers.getEquationKeys(payload, handler.maps)
  // const equationKeys = helpers.getEquationKeys1b(payload, last$, handler.maps)

  // make sure all '=' expressions will be evaluated
  lib.mergeIntoSet(equationKeys, handler.alwaysRun)

  console.log('equationKeys', equationKeys)

  let keyvalues = {}

  // iterate over set of eqnkeys and evaluate each
  for (let equationKey of equationKeys) {
    const expression = handler.augmentedExpressions[equationKey]
    const value = expression.fn(cache, $, keyvalues) // run the expression fn
    if (value !== undefined) {
      const cacheId = deviceId + '-' + equationKey // eg 'pa1-fault_count'
      // cache.set(cacheId, value) // save to the cache - may send shdr to tcp
      if (value !== undefined) {
        console.log('cache.set', equationKey, value)
        cache[equationKey] = value
      }
      // equationKeys2.add(cacheId)
    }
  }
  // last$ = { ...$ }

  console.log('cache', cache)
  console.log()
}
