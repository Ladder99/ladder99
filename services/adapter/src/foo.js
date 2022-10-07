// get a selector function or boolean from a selector object.
// eg {id:3,foo:5} gives a function
//   payload => payload.id == 3 && payload.foo == 5
// or a boolean, eg true gives true.
// note: we use == instead of === to account for numbers and strings.
// also: since we're building the fn with a string, we can use
//   selector.toString() to compare fns for equality, as long as keys are sorted the same.
//   this will be used in subscribing and unsubscribing to topics/payloads.
export function getSelector(selectorObj) {
  let selector
  if (typeof selectorObj === 'object') {
    // build a fn string
    let str = 'payload => '
    const lst = []
    for (let key of Object.keys(selectorObj)) {
      //. handle if value is a string
      lst.push('payload.' + key + ' == ' + selectorObj[key])
    }
    str += lst.join(' && ')
    // eval the string
    try {
      selector = eval(str)
    } catch (e) {
      console.log('error evaluating filter selector', e.message)
      console.log(str)
    }
  } else {
    selector = filterObj // eg true
  }
  return selector
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

export function getSelector(filterObj) {
  const filter = getFilterFn(filterObj)
  const equal = 0 //getEqualFn() //.?
  const selector = { filter, equal }
  return selector
}
