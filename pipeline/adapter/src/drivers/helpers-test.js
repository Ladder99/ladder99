import { compile, compileInputs, getEquationKeys } from './helpers.js'

const prefix = 'pr1-'

// ~inputs.yaml
const inputs = {
  has_current_job: "=!!$['%Z61.0']",
  job_meta: "=msg('%Z61.0')",
  carton_quantity: '=(<job_meta> || {}).carton_quantity',
}

// ~mqtt message payload
const payload = [{ address: '%Z61.0', value: { carton_quantity: 5 } }]

// ~cache
const cache = {}
const $ = {}

// if (0) {
//   const code = `msg('foo') + <bar>`
//   const { js, refs } = compile(code, prefix)
//   console.log(code)
//   console.log(js)
//   console.log(refs)
// }

{
  const { augmentedInputs, maps } = compileInputs(inputs, prefix)
  // console.log(augmentedInputs)
  // console.log(maps)

  // get set of keys for eqns we need to execute
  const equationKeys = getEquationKeys(payload, maps)
  console.log('equationKeys', equationKeys)

  // initialize $ dictionary
  payload.forEach(item => ($[item.address] = item))

  // iterate over set of eqnkeys and evaluate each
  for (let equationKey of equationKeys) {
    const aug = augmentedInputs[equationKey]
    const value = aug.fn(cache, $)
    cache[equationKey] = value
  }

  console.log('cache', cache)
}
