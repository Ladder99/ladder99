import { compile, compileInputs } from './helpers.js'

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
    has_current_job: "=!!msg('%Z61.0')",
    carton_quantity: '=(<job_meta> || {}).carton_quantity',
  }
  const { augmentedInputs, maps } = compileInputs(inputs, prefix)
  console.log(augmentedInputs)
  console.log(maps)

  const payload = [{ addr: '%Z61.0', default: 1, value: 2 }]

  const keys = new Set()
  for (const item of payload) {
    const { addr } = item
    const set = maps.addr[addr]
    if (set) {
      for (let key of set) keys.add(key)
    }
  }
  // now have a set of keys for eqns we need to execute
  console.log(keys)

  const cache = {}
  const $ = {
    '%Z61.0': { address: '%Z61.0', default: 1, value: 2 },
  }

  for (let key of keys) {
    const aug = augmentedInputs[key]
    aug.js2 = '(cache, $) => ' + aug.js
    aug.fn = eval(aug.js2)
    console.log(aug)
    console.log(aug.fn.toString())
    const value = aug.fn(cache, $)
    console.log(value)
  }
}
