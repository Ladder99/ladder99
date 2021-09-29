import { getReferences } from './helpers.js'

const str = `msg('foo') + <bar>`
const { code, refs } = getReferences(str)

console.log(code)
console.log(refs)
