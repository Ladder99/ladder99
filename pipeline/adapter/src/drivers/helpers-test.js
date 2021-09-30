import { compile } from './helpers.js'

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
  const k = {}
  for (let [key, code] of Object.entries(inputs)) {
    const { js, refs } = compile(code, prefix)
    // console.log(key)
    // console.log(code)
    // console.log(js)
    console.log(refs)
    for (let macroKey of Object.keys(refs)) {
      // addr, cache
      const refset = refs[macroKey] // set{'%Z61.0'}
      for (let ref of refset) {
        if (k[macroKey]) {
          k[macroKey].add(ref)
        } else {
          k[macroKey] = new Set([ref])
        }
      }
    }
  }
  console.log(k)
}
