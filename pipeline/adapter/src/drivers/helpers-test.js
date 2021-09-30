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
  const k = compileInputs(inputs, prefix)
  console.log(k)
}
