// cache to be shared across devices
// might want something more sophisticated eventually

export class Cache {
  constructor() {
    this._map = new Map()
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
