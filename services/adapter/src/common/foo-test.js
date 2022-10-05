import libyaml from 'js-yaml' // see https://github.com/nodeca/js-yaml
import * as foo from './foo.js'

let str = `
payload:
  id: \${device.custom.plc.ids.io} # varies by device, eg 535172
  a15: 5392 # same as publish.values[0]
`

// read yaml 'file' and return a yaml object
let tree = libyaml.load(str)
console.log(tree)

// get a filter object from the yaml
let filterObj = tree.payload
console.log(filterObj)

// convert all filter attribute values,
// given some tree of reference data
filterObj = foo.convert(filterObj, tree)
console.log(filterObj)

// get a filter fn from a filter object,
// eg { id:3, foo:5 }
// to obj => obj.id==3 && obj.foo==5
let fn = foo.getFilterFn(filterObj)
console.log(fn.toString())

// fn(testObj)
