// get a filter fn from an object, eg {id:3,foo:5}
export function getFilterFn(obj) {
  // return obj => obj.id == 3 && obj.foo == 5
  // build a fn string, eval it
  let str = 'obj => '
  let lst = []
  for (let key of Object.keys(obj)) {
    lst.push('obj.' + key + ' == ' + obj[key])
  }
  str += lst.join(' && ')
  let fn
  try {
    fn = eval(str)
  } catch (e) {
    console.log(str)
    console.log('error', e.message)
    return
  }
  return fn
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

export function getSelector()

