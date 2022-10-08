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
  // console.log(str)
  let ref
  try {
    const regex = /\$\{(.*)\}/
    ref = str.match(regex)[1]
  } catch (e) {}
  // console.log(ref)
  //. lookup the ref string in the tree
  if (ref) {
    ref = lookup(ref, tree)
    return ref
  }
  return str
}

export function lookup(ref, tree) {
  let parts = ref.split('.')
  for (let part of parts) {
    tree = tree[part]
  }
  return tree
}
