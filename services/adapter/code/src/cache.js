export class Cache {
  constructor() {
    this._map = new Map()
  }
  set(key, value) {
    this._map.set(key, value)
    //. call the shdr update fn - for each shdr value change calls sendToOutput
    // updateShdr()
  }
  get(key) {
    return this._map.get(key)
  }
}
