import * as lib from './lib.js'

// // console.log(process.env)
// let setup = {
//   a: 'pok',
//   b: '$FOO || test',
//   c: [1, 2, 3],
//   d: { e: 1, f: '$SHELL' },
// }
// console.log(setup)
// let setup2 = lib.replaceEnvars(setup)
// console.log(setup)

console.log(lib.rounded(1.23456789, 3))
console.log(lib.rounded('UNAVAILABLE'))
console.log(lib.rounded('UNAVAILABLE', 3))
console.log(lib.rounded(1.23456789))
console.log(lib.rounded(1.23456789, 0))
console.log(lib.rounded(1234.56789, -1))
console.log(lib.rounded(1234.56789, -3))
