// cache of key-item pairs.
// when key-item is set, will perform any associated outputs calculations and
// send shdr output to attached tcp socket.

export class Cache {
  constructor() {
    this._map = new Map() // key-item pairs //. why not just {} ?
    this._mapKeyToOutputs = {} // list of outputs assoc with each key
  }

  // addOutputs
  // each key can have multiple outputs calculations associated with it.
  // this builds a map from key to list of outputs.
  // each output goes to the same socket.
  // outputs is an array of Output objects
  // Output is { category, type, representation, key, socket, dependsOn, value }
  // dependsOn is array of strings
  // value is a fn
  addOutputs(outputs, socket) {
    console.log(`cache.addOutputs - add ${outputs.length} outputs`)
    for (const output of outputs) {
      output.socket = socket // attach tcp socket to each output also
      for (const key of output.dependsOn) {
        if (this._mapKeyToOutputs[key]) {
          this._mapKeyToOutputs[key].push(output)
        } else {
          this._mapKeyToOutputs[key] = [output]
        }
      }
    }
  }

  // set a cache key-item pair.
  // called item, because each item is an object that can have a value property.
  set(key, item) {
    console.log('cache.set', key, JSON.stringify(item).slice(0, 99))
    // update the cache item
    this._map.set(key, item)
    // get list of outputs associated with this key
    const outputs = this._mapKeyToOutputs[key] || []
    // calculate outputs and send dependent shdr values to tcp
    for (const output of outputs) {
      const shdr = getShdr(this, output)
      // send shdr to agent via tcp socket
      console.log(`TCP sending string`, shdr.slice(0, 60), `...`)
      output.socket.write(shdr + '\n')
    }
  }

  // get item from cache
  get(key) {
    const item = this._map.get(key) || {} //. have default? return undefined?
    return item
  }
}

// calculate SHDR using the given output object.
// cache is the Cache object.
// output has { key, category, type, representation, value, ... }.
function getShdr(cache, output) {
  const timestamp = new Date().toISOString() //. get from item
  //. rename .value to .getValue or .valueFn
  const { key, category, type, representation, value: getValue } = output
  const value = getValue(cache) // do calculation
  let shdr = ''
  // handle different shdr types and representations
  //. shouldn't this be dataitemId, not key?
  if (category === 'EVENT' || category === 'SAMPLE') {
    shdr = `${timestamp}|${key}|${value}`
  } else if (category === 'CONDITION') {
    //. pick these values out of the value, which should be an object, eh?
    const level = value // eg 'WARNING' -> element 'Warning'
    const nativeCode = 'nativeCode'
    const nativeSeverity = 'nativeSeverity'
    const qualifier = 'qualifier'
    const message = value + ' (msg here)'
    shdr = `${timestamp}|${key}|${level}|${nativeCode}|${nativeSeverity}|${qualifier}|${message}`
    // } else if (representation === 'DATA_SET') {
    //   const nativeCode = 'nativeCode'
    //   const message = value + ' (msg here)'
    //   shdr = `${timestamp}|${key}|${nativeCode}|${message}`
  } else {
    console.warn(`warning: unknown category '${category}'`)
  }
  return shdr
}
