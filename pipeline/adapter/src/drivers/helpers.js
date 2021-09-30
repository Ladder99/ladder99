const getMacros = prefix => ({
  // replace all occurrences of msg('foo') with ($['foo'] || {}).default or .value.
  addr: {
    syntax: /msg\('(.*?)'\)/gm, // eg msg('foo')
    transform: `($['$1'] || {}).default`, // $1 is the matched substring //...
    extract: /\$\['(.*?)'\]/gm, // eg $['foo']
  },
  // replace all occurrences of <foo> with cache.get('pr1-foo').
  cache: {
    syntax: /(<(.*?)>)/gm, // eg <foo>
    transform: `cache.get('${prefix}$2')`, // $2 is the matched substring
    extract: /cache\.get\('(.*?)'\)/gm, // eg cache.get('foo')
  },
})

// find all references in the given code - return transformed code and refs
// eg
//   precompile(`=msg('foo') + <bar>`, macros)
// returns {
//   js: "(cache, $) => ($['foo'] || {}).default + cache.get('pr1-bar')",
//   refs: { addr: Set(1) { '%Z61.0' }, cache: Set(1) { 'pr1-bar' } }
// }
export function precompile(code, macros) {
  let js = code.slice(1)
  let refs = {}
  for (let macroName of Object.keys(macros)) {
    const macro = macros[macroName]
    macro.key = macroName

    // note: .*? is a non-greedy match, so doesn't eat other occurrences also.
    // note: replaceAll needs node15 - use /g flag for regexp here
    js = js.replace(macro.syntax, macro.transform)

    // get list of message addrs or cache keys the code references.
    // need to get AFTER transforms, because user could specify this manually also.
    refs[macroName] = new Set()
    let match
    while ((match = macro.extract.exec(js)) !== null) {
      const key = match[1]
      refs[macroName].add(key)
    }
  }
  js = '(cache, $) => ' + js
  return { js, refs }
}

export function compile(code, prefix) {
  const macros = getMacros(prefix)
  const { js, refs } = precompile(code, macros)
  console.log({ js, refs })
  return { js, refs }
}

export function compileInputs(inputs, prefix) {
  const augmentedInputs = {}
  const maps = {}
  for (let [key, code] of Object.entries(inputs)) {
    const { js, refs } = compile(code, prefix)
    console.log(key)
    console.log(code)
    console.log(js)
    console.log(refs)
    console.log()
    const fn = eval(js)
    augmentedInputs[key] = { code, js, fn, refs }
    addToMaps(maps, key, refs)
  }
  return { augmentedInputs, maps }
}

// maps is eg {}
// refs is eg { addr: Set(0) {}, cache: Set(1) { 'pr1-job_meta' } }
// maps is eg { addr: {foo: Set(1) { '%Z61.0' }}, cache: {bar: Set(1) { 'pr1-job_meta' }} }
export function addToMaps(maps, key, refs) {
  // macroKey is addr or cache
  for (let macroKey of Object.keys(refs)) {
    const refset = refs[macroKey] // eg set{'%Z61.0'}
    for (let ref of refset) {
      if (!maps[macroKey]) {
        maps[macroKey] = {}
      }
      if (maps[macroKey][ref]) {
        maps[macroKey][ref].add(key)
      } else {
        maps[macroKey][ref] = new Set([key])
      }
    }
  }
}

// get equation keys
// iterate over message array,
// lookup what fns are associated with each address,
export function getEquationKeys(payload, maps) {
  const equationKeys = new Set()
  for (const item of payload) {
    const { addr } = item
    const set = maps.addr[addr]
    if (set) {
      for (let key of set) {
        equationKeys.add(key)
      }
    }
  }
  return equationKeys
}
