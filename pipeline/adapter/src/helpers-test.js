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
        has_current_job: "=!!$['%Z61.0']",
        job_meta: "=msg('%Z61.0')",
        carton_quantity: '=(<job_meta> || {}).carton_quantity',
      },
    },
  },
}

// ~cache
const cache = {}

const prefix = 'pr1-'

// ~mqtt message payload
const payload = [{ address: '%Z61.0', value: { carton_quantity: 5 } }]

// initialize $ dictionary
const $ = {}
payload.forEach(item => ($[item.address] = item))

// compile inputs yaml
const handler = inputs.handlers['l99/ccs/foo']
const macros = getMacros(prefix, handler.accessor)
const maps = compileExpressions(handler.expressions, macros)
console.log('maps', maps)

// get set of keys for eqns we need to execute
const equationKeys = getEquationKeys(payload, maps)
console.log('equationKeys', equationKeys)

// iterate over set of eqnkeys and evaluate each
for (let equationKey of equationKeys) {
  const input = handler.inputs[equationKey]
  const value = input.fn(cache, $)
  cache[equationKey] = value
}

console.log('cache', cache)
