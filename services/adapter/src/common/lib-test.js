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

console.log(lib.round(1.23456789, 3))
console.log(lib.round('UNAVAILABLE'))
console.log(lib.round('UNAVAILABLE', 3))
console.log(lib.round(1.23456789))
console.log(lib.round(1.23456789, 0))
console.log(lib.round(1234.56789, -1))
console.log(lib.round(1234.56789, -3))
