import { precompile } from './helpers.js'

const str = `msg('foo') + <bar>`
const { code, refs } = precompile(str)

console.log(code)
console.log(refs)
