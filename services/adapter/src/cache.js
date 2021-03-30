export class Cache {
  constructor() {
    this._map = new Map()
    this._mapKeyToCalcs = {}
  }

  addCalcs(calcs, socket) {
    for (const calc of calcs) {
      console.log({ calc })
      calc.socket = socket
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
    console.log('set', key, item)
    this._map.set(key, item)
    // calc and send dependent shdr values
    const calcs = this._mapKeyToCalcs[key] || []
    for (const calc of calcs) {
      console.log(calc.key)
      const shdr = getShdr(this, calc)
      // send shdr to agent via tcp socket
      console.log(`TCP sending string`, shdr.slice(0, 60), `...`)
      calc.socket.write(shdr + '\n')
    }
  }

  get(key) {
    const item = this._map.get(key) || {}
    console.log('get', key, item)
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
