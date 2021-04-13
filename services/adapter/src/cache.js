// cache of key-item pairs.
// when key-item is set, will perform any associated outputs calculations and
// send shdr output to attached tcp socket.

/**
 * @typedef {Object} Item
 * @property {any} value
 */

/**
 * @typedef {Object} Output
 * @property {string} key
 * @property {object} socket
 * @property {string[]} dependsOn
 * @property {function} value
 */

export class Cache {
  constructor() {
    this._map = new Map() // key-item pairs
    this._mapKeyToOutputs = {} // list of outputs assoc with each key
  }

  /**
   * addOutputs
   * each key can have multiple outputs calculations associated with it.
   * this builds a map from key to list of outputs.
   * each output goes to the same socket.
   * @param {Output[]} outputs
   * @param {object} socket
   */
  addOutputs(outputs, socket) {
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

  /**
   * set a cache key-item pair.
   * called item, because each item is an object that can have a value property.
   * @param {string} key
   * @param {Item} item
   */
  set(key, item) {
    console.log('set', key, JSON.stringify(item).slice(0, 99))
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

  /**
   * get item from cache
   * @param key {string}
   * @returns {Item}
   */
  get(key) {
    const item = this._map.get(key) || {} //. have default? return undefined?
    return item
  }
}

/**
 * calculate SHDR using the given output object.
 * could have other output types also
 * @param {Cache} cache
 * @param {Output} output
 */
function getShdr(cache, output) {
  const timestamp = new Date().toISOString() //. might need to get from item
  const key = output.key
  const value = output.value(cache) // do calculation - value is a fn of cache
  const shdr = `${timestamp}|${key}|${value}`
  return shdr
}
