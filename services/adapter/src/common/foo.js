// get a filter fn from an object, eg {id:3,foo:5}
export function getFilterFn(obj) {
  return obj => obj.id == 3 && obj.foo == 5
}

// convert all filter attribute values,
// given some tree of reference data
export function convert(obj, tree) {
  for (let key of Object.keys(obj)) {
    let value = obj[key]
    obj[key] = getValue(value, tree)
  }
  return obj
}

// get a value from a string, which is potentially a reference to a part of a tree
export function getValue(str, tree) {
  const ref = str.match(/\$\{(.*)\}/)
  //. lookup the ref string in the tree
  ref = lookup(ref, tree)
  return ref
}

function lookup(ref, tree) {
  let parts = ref.split('.')
  for (let part of parts) {
    tree = tree[part]
  }
  return tree
}
