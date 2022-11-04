import libyaml from 'js-yaml' // see https://github.com/nodeca/js-yaml
import * as refs from './refs.js'

// let str = `
// payload:
//   id: \${device.custom.plc.ids.io} # varies by device, eg 535172
//   a15: 5392 # same as publish.values[0]
// device:
//   custom:
//     plc:
//       ids:
//         io: 421
// `

// // read yaml 'file' and return a yaml object
// let tree = libyaml.load(str)
// // console.log(tree)
// // console.dir(tree, { depth: null })

// // get a filter object from the yaml
// let filterObj = tree.payload
// // console.log(filterObj)

// // convert all filter attribute values,
// // given some tree of reference data
// // eg gives { id: 421, a15: 5392 }
// let filterObj2 = refs.convert(filterObj, tree)
// console.log(filterObj2)

// // get a filter fn from a filter object,
// // eg { id:3, refs:5 }
// // to obj => obj.id==3 && obj.refs==5
// let fn = refs.getFilterFn(filterObj2)
// // console.log(fn)
// console.log(fn.toString())

// let testObj = { id: 421, a15: 5392, b: 3 }
// let testValue = fn(testObj)
// console.log(testValue)

// // let pokoij = { pok: { oij: 3 } }
// // let val = refs.lookup('pok.oij', pokoij)
// // console.log(val)

let filterObj = { id: 421, a15: 5392 }
let selector = refs.getSelector(filterObj)
console.log(selector)
console.log(selector.filter.toString())
// console.dir(selector, { depth: null })

let testObj = { id: 421, a15: 5392, b: 3 }
console.log(testObj)
let testValue = selector.filter(testObj)
console.log(testValue)
