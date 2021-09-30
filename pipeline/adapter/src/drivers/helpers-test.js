import { compile } from './helpers.js'

const code = `msg('foo') + <bar>`
const { js, refs } = compile(code, 'pr1')

console.log(code)
console.log(js)
console.log(refs)
