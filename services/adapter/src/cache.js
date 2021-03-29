// import mobx

export class Cache {
  constructor(socket) {
    this._map = new Map()
    this._socket = socket
  }
  set(key, value) {
    this._map.set(key, value)
    //. call the shdr update fn to update dependent shdr values
    // updateShdr(key)
  }
  get(key) {
    return this._map.get(key)
  }
}

// // get all shdr outputs for the cache values
// function getOutput(cache) {
//   const output = []
//   for (const calc of calcs) {
//     const timestamp = new Date().toISOString()
//     const key = calc.key
//     const value = calc.value(cache) // do calculation
//     const shdr = `${timestamp}|${key}|${value}`
//     console.log(shdr)
//     output.push(shdr)
//   }
//   return output.join('\n') + '\n'
// }
