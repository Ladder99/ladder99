// test helper fns
// run:
//   cd pipeline/adapter
//   node src/helpers-test.js

import { getMacros, compileExpressions, getEquationKeys } from './helpers.js'

// ~inputs.yaml
const inputs = {
  handlers: {
    'l99/ccs/foo': {
      accessor: 'value',
      expressions: {
        has_current_job: "!!$['%Z61.0']",
        job_meta: "msg('%Z61.0')",
        carton_quantity: '(<job_meta> || {}).carton_quantity',
      },
    },
  },
}

// ~cache
const cache = {}

const deviceId = 'pr1'

const prefix = deviceId + '-'

// ~mqtt message payload
const payload = [{ address: '%Z61.0', value: { carton_quantity: 5 } }]

// initialize $ dictionary
const $ = {}
payload.forEach(item => ($[item.address] = item))

// compile inputs yaml
const handler = inputs.handlers['l99/ccs/foo']
const macros = getMacros(prefix, handler.accessor)
// const maps = compileExpressions(handler.expressions, macros)
const { augmentedExpressions, maps } = compileExpressions(
  handler.expressions,
  macros
)
console.log('augexprs', augmentedExpressions)
console.log('maps', maps)
handler.augmentedExpressions = augmentedExpressions
handler.maps = maps

// get set of keys for eqns we need to execute
const equationKeys = getEquationKeys(payload, handler.maps)
console.log('equationKeys', equationKeys)

let keyvalues = {}

// iterate over set of eqnkeys and evaluate each
for (let equationKey of equationKeys) {
  // const input = handler.inputs[equationKey]
  // const value = input.fn(cache, $)
  // cache[equationKey] = value
  const expression = handler.augmentedExpressions[equationKey]
  const value = expression.fn(cache, $, keyvalues) // run the expression fn
  if (value !== undefined) {
    const cacheId = deviceId + '-' + equationKey // eg 'pa1-fault_count'
    cache[equationKey] = value
    // cache.set(cacheId, value) // save to the cache - may send shdr to tcp
    // equationKeys2.add(cacheId)
  }
}

console.log('cache', cache)
