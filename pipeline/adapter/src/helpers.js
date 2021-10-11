// helper fns for different drivers

import { v4 as uuid } from 'uuid' // see https://github.com/uuidjs/uuid - may be used by inputs/outputs yaml js

let keyvalues = {}

// define macros to be used by input/output yamls
// prefix is deviceId- eg 'pr1-'
// accessor is default or value
export const getMacros = (prefix, accessor) => ({
  // replace all occurrences of msg('foo') with ($['foo'] || {}).default or .value
  addr: {
    syntax: /msg\('(.*?)'\)/gm, // eg msg('foo')
    transform: `($['$1'] || {}).${accessor}`, // $1 is the matched substring
    extract: /\$\['(.*?)'\]/gm, // eg $['foo']
  },
  // replace all occurrences of <foo> with cache.get('pr1-foo').
  cache: {
    syntax: /(<(.*?)>)/gm, // eg <foo>
    transform: `cache.get('${prefix}$2')`, // $2 is the matched substring
    extract: /cache\.get\('(.*?)'\)/gm, // eg cache.get('foo')
  },
})

// compile code and find all references to message contents or cache.
// returns transformed code and refs.
// eg
//   compile(`=msg('foo') + <bar>`, macros)
// returns {
//   js: "(cache, $) => ($['foo'] || {}).default + cache.get('pr1-bar')",
//   refs: { addr: Set(1) { '%Z61.0' }, cache: Set(1) { 'pr1-bar' } }
// }
export function compile(code, macros) {
  console.log(`compile`, code)
  // let js = code.slice(1) // ditch '='
  let js = code
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
  js = '(cache, $, keyvalues) => ' + js //. needs to be assoc with all macros somehow
  console.log({ js, refs })
  return { js, refs }
}

export function compileExpressions(expressions, macros) {
  console.log(`compileExpressions`)
  const augmentedExpressions = {}
  const maps = {}
  for (let [key, expression] of Object.entries(expressions)) {
    // if (typeof expression === 'string' && expression.startsWith('=')) {
    const { js, refs } = compile(expression, macros)
    const fn = eval(js) // define the fn
    augmentedExpressions[key] = { expression, js, fn, refs }
    addToMaps(maps, key, refs)
    // }
  }
  console.log({ maps })
  return { augmentedExpressions, maps }
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
    const { address } = item
    const set = maps.addr[address]
    if (set) {
      for (let key of set) {
        equationKeys.add(key)
      }
    }
  }
  return equationKeys
}

// get equation keys ii
// iterate over eqnkeys,
// lookup what other eqns are associated with each eqnkey
//. merge with above fn
export function getEquationKeys2(eqnkeys, maps) {
  const equationKeys = new Set()
  for (const eqnkey of eqnkeys) {
    const set = maps.cache[eqnkey]
    if (set) {
      for (let key of set) {
        equationKeys.add(key)
      }
    }
  }
  return equationKeys
}