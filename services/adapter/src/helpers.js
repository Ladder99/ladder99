// helper fns for different drivers

// import { v4 as uuid } from 'uuid' // see https://github.com/uuidjs/uuid - may be used by inputs/outputs yaml js
import * as lib from './common/lib.js'

//. is this used? by the eval fns? should it not be instantiated in a class for each device?
let keyvalues = {}

// load the plugin specified by the drivers folder and driver name.
// the driver can be at eg ./drivers/foo.js or ./drivers/foo/index.js.
// the plugin must export a class named AdapterDriver.
// this code will instantiate the driver and return it.
// the AdapterDriver class must have a start({}) method to start it up.
export async function getPlugin(driversFolder, driver) {
  let code
  try {
    const path = `${driversFolder}/${driver}.js`
    console.log(`Adapter importing driver code: ${path}...`)
    code = await import(path) // load the code
  } catch (error) {
    const path = `${driversFolder}/${driver}/index.js`
    console.log(`Adapter importing driver code: ${path}...`)
    code = await import(path) // load the code
  }
  const { AdapterDriver } = code
  const plugin = new AdapterDriver() // instantiate the driver
  return plugin
}

// get cache outputs from from outputs.yaml templates - do substitutions etc.
// each element defines a shdr output.
// templates is from outputs.yaml - array of { key, category, type, value, ... }.
// types is from types.yaml - object of objects with key:values.
// returns array of {key: string, value: int|str, dependsOn: string[]}.
// eg [{ key: 'ac1-power_condition', value: 'FAULT', dependsOn: ['ac1-power_fault', 'ac1-power_warning']}, ...]
// note: types IS used - it's in the closure formed by eval(str).
export function getOutputs({ templates, types, deviceId }) {
  // console.log('getOutputs - iterate over output templates')
  const outputs = templates.map(template => {
    // const { value, dependsOn } = getValueFn(deviceId, template.value, types)
    const { value, dependsOn } = getValueFn(
      deviceId,
      template.value || `<${template.key}>`, // if value not specified, use <key>
      types
    )
    // get output object
    // eg {
    //   key: 'ac1-power_condition',
    //   value: cache => cache.get('pr1-avail').value,
    //   dependsOn: ['ac1-power_fault', 'ac1-power_warning'],
    //   category: 'CONDITION',
    //   type: 'VOLTAGE_DC',
    //   representation: undefined,
    // }
    const output = {
      // this is key in sense of shdr key
      //. assume each starts with deviceId? some might end with a number instead
      //. call this id, as it's such in the agent.xml
      //. need to handle arbitrary deviceIds also, eg for jobboss to cutter connections?
      //. eg could each output template have an optional deviceId to use here,
      // in place of the default?
      // key: `${deviceId}-${template.key}`,
      key: `${template.deviceId || deviceId}-${template.key}`,
      value, //. getValue or valueFn
      dependsOn,
      //. currently these need to be defined in the outputs.yaml file,
      // instead of using the types in the module.xml file -
      // will need to fix that.
      category: template.category, // needed for cache getShdr fn
      type: template.type, // ditto
      representation: template.representation, // ditto
      nativeCode: template.nativeCode, //. ?
    }
    return output
  })
  return outputs
}

// get valueFn and dependsOn array from a js code statement
// eg "<foo>" becomes cache=>cache.get(`${deviceId}-foo`)
//. call this getReferences - let caller do the fn eval - that's out of place here
function getValueFn(deviceId, code = '', types = {}) {
  // replace all occurrences of <key> with `cache.get('...')`.
  // eg <status_faults> => cache.get(`${deviceId}-status_faults`)
  // note: .*? is a non-greedy match, so doesn't eat other occurrences also.
  const regexp1 = /(<(.*?)>)/gm
  // eg "<power_fault> ? 'FAULT' : <power_warning> ? 'WARNING' : 'NORMAL'"
  // eg "cache.get('ac1-power_fault') ? 'FAULT' : cache.get('ac1-power_warning') ? 'WARNING' : 'NORMAL'"
  // should be okay to ditch replaceAll because we have /g for the regexp
  // valueStr = valueStr.replaceAll( // needs node15
  //. test this with two cache refs in a string "<foo> + <bar>" etc
  // $2 is the matched substring
  code = code.replace(regexp1, `cache.get('${deviceId}-$2')`)
  if (code.includes('\n')) {
    code = '{\n' + code + '\n}'
  }

  // define the value function //. call it valueFn?
  const value = (cache, $, keyvalues) => eval(code)

  // get list of cache ids this calculation depends on.
  // get AFTER transforms, because user could specify a cache get manually.
  // eg dependsOn = ['ac1-power_fault', 'ac1-power_warning']
  const dependsOn = []
  const regexp2 = /cache\.get\('(.*?)'\)/gm
  let match
  while ((match = regexp2.exec(code)) !== null) {
    const key = match[1]
    dependsOn.push(key)
  }
  //. sort/uniquify dependsOn array
  return { value, dependsOn }
}

// define macros to be used by input/output yamls
// prefix is deviceId- eg 'pr1-'
// accessor is 'default' or 'value'
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

// compile code using macros and find all references to message contents
// or cache.
// returns transformed code, refs, and always execute flag.
// refs is { addr, cache }, with addr being a set of plc addresses referenced
// in the code, and cache the set of cache values referenced.
// the always flag is true if first char of code is '=', false otherwise.
// called by compileExpressions, below.
// eg
//   compile(`=msg('foo') + <bar>`, macros)
// returns {
//   js: "(cache, $) => ($['foo'] || {}).default + cache.get('pr1-bar')",
//   refs: { addr: set{ 'foo' }, cache: set{ 'pr1-bar' } },
//   always: true,
// }
export function compile(code, macros) {
  const always = code.startsWith('=')
  let js = always ? code.slice(1) : code // ditch '=' if there
  let refs = {}
  for (let macroName of Object.keys(macros)) {
    const macro = macros[macroName]
    macro.key = macroName

    // note: .*? is a non-greedy match, so doesn't eat other occurrences also.
    // note: replaceAll needs node15, so must use /g flag for regexp here.
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
  js = '(cache, $, keyvalues) => ' + js //. needs to be assoc with all macros somehow [?]
  // return { js, refs }
  return { js, refs, always }
}

// compile dict of expressions and return augmented expressions and maps.
//. explain more
// called by adapter when parsing inputs.yaml.
export function compileExpressions(expressions, macros) {
  const augmentedExpressions = {}
  const maps = {}
  for (let [key, expression] of Object.entries(expressions)) {
    const { js, refs, always } = compile(expression, macros)
    const fn = eval(js) // evaluate the code to define the fn
    augmentedExpressions[key] = { expression, js, fn, refs, always }
    addToMaps(maps, key, refs)
  }
  return { augmentedExpressions, maps }
}

// build up maps dicts, one for each macro type.
// eg will add to maps = { addr, cache }
//. explain more
// eg if maps is { addr: {foo: set{'%Z61.0'}}} ?
// key is eg 'bar' ?
// refs is eg { addr: set{}, cache: set{'pr1-job_meta'}}
// then maps becomes { addr: {foo: set{'%Z61.0'}}, cache: {bar: set{'pr1-job_meta'}}}
export function addToMaps(maps, key, refs) {
  // macroKey is 'addr' or 'cache'
  for (let macroKey of Object.keys(refs)) {
    const refset = refs[macroKey] // eg 'addr' -> set{'%Z61.0'}
    for (let ref of refset) {
      // initialize dict
      if (!maps[macroKey]) {
        maps[macroKey] = {}
      }
      // add key to new or existing set
      if (maps[macroKey][ref]) {
        maps[macroKey][ref].add(key)
      } else {
        maps[macroKey][ref] = new Set([key])
      }
    }
  }
}

// get equation keys
// iterate over message array, lookup what fns are associated
// with each address, return set of fn keys.
export function getEquationKeys(payload, maps) {
  const equationKeys = new Set()
  for (const item of payload) {
    const { address } = item
    const set = maps.addr[address]
    lib.mergeIntoSet(equationKeys, set)
  }
  return equationKeys
}

// get equation keys1b
// iterate over message array, lookup what fns are associated
// with each address, return set of fn keys.
//. check for values in payload that changed from previous $
// ie iterate over $ values, if any of those changed, add to the set
export function getEquationKeys1b(payload, last$, maps) {
  const equationKeys = new Set()
  const payloadAddresses = new Set()
  for (const item of payload) {
    const { address } = item // get address eg '%Z61.0'
    const lastValue = last$[address] && last$[address].value // get previous value, if any
    // only include eqnkey in the set if value has changed
    // note: if the value is an object, this will always evaluate to true, as would `!=`
    if (item.value !== lastValue) {
      const set = maps.addr[address] // get set of eqn keys triggered by that address, eg 'has_current_job', 'job_meta'
      // add all those eqn keys to the set (no set merge operation avail)
      lib.mergeIntoSet(equationKeys, set)
    }
    payloadAddresses.add(address)
  }
  // check for values in last$ that might have disappeared -
  // still want to trigger those expressions
  for (const address of Object.keys(last$)) {
    if (!payloadAddresses.has(address)) {
      const set = maps.addr[address] // get set of eqn keys triggered by that address, eg 'has_current_job', 'job_meta'
      // add all those eqn keys to the set (no set merge operation avail)
      lib.mergeIntoSet(equationKeys, set)
    }
  }
  return equationKeys
}

// get equation keys ii
// iterate over eqnkeys,
// lookup what other eqns are associated with each eqnkey
//. merge with getEquationKeys
export function getEquationKeys2(eqnkeys, maps) {
  const equationKeys = new Set()
  for (const eqnkey of eqnkeys) {
    const set = maps.cache[eqnkey]
    lib.mergeIntoSet(equationKeys, set)
  }
  return equationKeys
}

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
