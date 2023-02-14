// library of fns
// IMPORTANT: keep this in synch by copying between services when changed:
//   adapter, meter, recorder, relay
// also include lib-test.js
// be sure to `npm install js-yaml`
// simpler than making a library somewhere, for now

import fs from 'fs' // node lib for filesystem
import libyaml from 'js-yaml' // see https://github.com/nodeca/js-yaml
// import crypto from 'crypto' // node lib for random ids

// load setup yaml, eg from ../client-oxbox/setup.yaml
export function readSetup(setupFolder) {
  const yamlfile = `${setupFolder}/setup.yaml`
  console.log(`Reading ${yamlfile}...`)
  const yamltree = importYaml(yamlfile)
  const setup = yamltree
  if (!setup) {
    console.log(`No ${yamlfile} available - please add one.`)
    process.exit(1)
  }
  replaceEnvars(setup)
  return setup
}

// import a yaml file and parse to js struct.
// returns the js struct or null if file not avail.
export function importYaml(path) {
  try {
    const yaml = fs.readFileSync(path, 'utf8')
    const yamlTree = libyaml.load(yaml)
    return yamlTree
  } catch (error) {
    console.log(error.message)
  }
  return null
}

// recurse over all values in a yaml,
// replacing eg $FOO with process.env['FOO'].
//. better - just replace all '${FOO}' with process.env['FOO'] etc
export function replaceEnvars(setup) {
  if (setup === undefined || setup === null) return // in case of malformed file
  for (let key of Object.keys(setup)) {
    const value = setup[key]
    if (typeof value === 'string' && value[0] === '$') {
      const envarName = value.slice(1)
      //. replace $word with process.env[word] and eval it
      //. or have explicit OR syntax, or check for ||
      const envarValue = process.env[envarName]
      // console.log(`replacing ${value} with ${envarValue}`)
      setup[key] = envarValue
    } else if (typeof value === 'object') {
      replaceEnvars(value) // recurse
    }
  }
}

// sleep ms milliseconds
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// check if value is an object
// a missing piece of javascript syntax
export function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

// print a complete object tree (console.log only does to depth 2)
export function print(...obj) {
  console.dir(...obj, { depth: null })
}

// do shallow equality comparison of two objects
// https://stackoverflow.com/questions/22266826/how-can-i-do-a-shallow-comparison-of-the-properties-of-two-objects-with-javascri
export function shallowCompare(obj1, obj2) {
  return (
    Object.keys(obj1).length === Object.keys(obj2).length &&
    Object.keys(obj1).every(
      key => obj2.hasOwnProperty(key) && obj1[key] === obj2[key]
    )
  )
}

// convert a string list of items to a set
// eg 'pok,oij,lkm' -> set{'pok','oij','lkm'}
export function getSet(str) {
  return new Set(str.split(','))
}

// get camelCase of a string, eg convert 'DataItem' to 'dataItem'
export function getCamelCase(str) {
  return str[0].toLowerCase() + str.slice(1)
}

// merge one set into another set
// modifies setBase in place
export function mergeIntoSet(setBase, setExtra) {
  if (setExtra) {
    for (let key of setExtra) {
      setBase.add(key)
    }
  }
}

// round a number to a given number of decimals.
// use negative num to round to a power of 10, eg -6 would round to 1 million.
// passes strings through unmodified.
export function round(value, decimals = 0) {
  if (typeof value !== 'number') return value // in case get passed a string
  if (value !== null && value !== undefined) {
    if (decimals < 0) {
      const factor = Math.pow(10, decimals)
      return Number(Math.round(value * factor) / factor).toFixed(0)
    }
    return Number(value).toFixed(decimals)
  }
  return null
}

// truncate a string to some length, adding ellipsis if truncated
export function truncate(str, len = 60) {
  return str.length > len ? str.slice(0, len) + '...' : str
}
