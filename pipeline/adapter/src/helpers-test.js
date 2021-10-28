// test helper fns
// usage:
//   cd pipeline/adapter
//   node src/helpers-test.js

// import { getMacros, compileExpressions, getEquationKeys } from './helpers.js'
import * as helpers from './helpers.js'

// ~inputs.yaml
const inputs = {
  handlers: {
    'l99/ccs/foo': {
      accessor: 'value',
      expressions: {
        has_current_job: "!!$['%Z61.0']",
        job_meta: "msg('%Z61.0')",
        carton_quantity: '(<job_meta> || {}).carton_quantity',
        job_complete: "msg('%Z61.22') === true",
      },
    },
  },
}

// ~cache
const cache = {}

const deviceId = 'pr1'

const prefix = deviceId + '-'

// ~mqtt message payloads
const payloads = [
  [{ address: '%Z61.0', value: { carton_quantity: 5 } }], // job meta
  [{ address: '%Z61.22', value: true }], // job complete
]

let last$ = {}

for (let payload of payloads) {
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
  // console.log('augexprs', augmentedExpressions)
  // console.log('maps', maps)
  handler.augmentedExpressions = augmentedExpressions
  handler.maps = maps

  // get set of keys for eqns we need to execute
  // const equationKeys = helpers.getEquationKeys(payload, handler.maps)
  const equationKeys = helpers.getEquationKeys1b(payload, last$, handler.maps)
  // console.log('equationKeys', equationKeys)

  let keyvalues = {}

  // iterate over set of eqnkeys and evaluate each
  for (let equationKey of equationKeys) {
    const expression = handler.augmentedExpressions[equationKey]
    const value = expression.fn(cache, $, keyvalues) // run the expression fn
    if (value !== undefined) {
      const cacheId = deviceId + '-' + equationKey // eg 'pa1-fault_count'
      // cache.set(cacheId, value) // save to the cache - may send shdr to tcp
      if (value !== undefined) {
        cache[equationKey] = value
      }
      // equationKeys2.add(cacheId)
    }
  }
  last$ = { ...$ }

  console.log('cache', cache)
}
