import { compile, compileInputs, getEquationKeys } from './helpers.js'

const prefix = 'pr1-'

if (0) {
  const code = `msg('foo') + <bar>`
  const { js, refs } = compile(code, prefix)
  console.log(code)
  console.log(js)
  console.log(refs)
}

{
  const inputs = {
    has_current_job: "=!!$['%Z61.0']",
    job_meta: "=msg('%Z61.0')",
    carton_quantity: '=(<job_meta> || {}).carton_quantity',
  }
  const { augmentedInputs, maps } = compileInputs(inputs, prefix)
  // console.log(augmentedInputs)
  // console.log(maps)

  const payload = [{ address: '%Z61.0', value: { carton_quantity: 5 } }]

  // get eqn keys
  const keys = getEquationKeys(payload, maps)
  // now have a set of keys for eqns we need to execute
  console.log('keys', keys)

  const cache = {}
  const $ = {}
  payload.forEach(item => ($[item.address] = item))

  // iterate over set of keys for eqns
  for (let key of keys) {
    const aug = augmentedInputs[key]
    aug.fn = eval(aug.js)
    // console.log(aug)
    // console.log(aug.fn.toString())
    const value = aug.fn(cache, $)
    // console.log(value)
    cache[key] = value
  }
  console.log('cache', cache)
}
