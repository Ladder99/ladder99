// cache of key-value pairs.
// when key-value is set, will perform any associated outputs calculations and
// send shdr output to attached tcp socket.

/**
 * @typedef {Object} Output
 * @property {string} key
 * @property {object} socket
 * @property {string[]} dependsOn
 * @property {function} value
 */

export class Cache {
  constructor() {
    this._map = new Map() // key-value pairs
    this._mapKeyToOutputs = {} // list of outputs assoc with each key
  }

  /**
   * addOutputs
   * each key can have multiple outputs calculations associated with it.
   * this builds a map from key to list of outputs.
   * each output goes to the same socket.
   * @param {Output[]} outputs
   * @param socket
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
   * set a cache key-value pair.
   * called item, because each item can have a value.
   * @param {string} key
   * @param {object} item
   */
  set(key, item) {
    console.log('set', key)
    // update the cache value
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
   * get key-value value
   */
  get(key) {
    const item = this._map.get(key) || {} //. have default?
    return item
  }
}

/**
 * calculate shdr using the given output object.
 * could have other output types also
 * @param {Cache} cache
 * @param {Output} output
 */
function getShdr(cache, output) {
  const timestamp = new Date().toISOString()
  const key = output.key
  const value = output.value(cache) // do calculation - value is a fn of cache
  const shdr = `${timestamp}|${key}|${value}`
  return shdr
}
