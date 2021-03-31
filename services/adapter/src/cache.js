// cache of key-value pairs.
// when key-value is set, will perform any associated calcs and
// send shdr output to attached tcp socket.

export class Cache {
  constructor() {
    this._map = new Map()
    this._mapKeyToCalcs = {}
  }

  // each key can have multiple calculations associated with it.
  // this builds a map from key to list of calcs.
  addCalcs(calcs, socket) {
    for (const calc of calcs) {
      calc.socket = socket // attach tcp socket to calc also
      for (const key of calc.dependsOn) {
        if (this._mapKeyToCalcs[key]) {
          this._mapKeyToCalcs[key].push(calc)
        } else {
          this._mapKeyToCalcs[key] = [calc]
        }
      }
    }
  }

  set(key, item) {
    console.log('set', key)
    this._map.set(key, item)
    // calc and send dependent shdr values
    const calcs = this._mapKeyToCalcs[key] || []
    for (const calc of calcs) {
      const shdr = getShdr(this, calc)
      // send shdr to agent via tcp socket
      console.log(`TCP sending string`, shdr.slice(0, 60), `...`)
      calc.socket.write(shdr + '\n')
    }
  }

  get(key) {
    const item = this._map.get(key) || {}
    return item
  }
}

function getShdr(cache, calc) {
  const timestamp = new Date().toISOString()
  const key = calc.key
  const value = calc.value(cache) // do calculation
  const shdr = `${timestamp}|${key}|${value}`
  return shdr
}
