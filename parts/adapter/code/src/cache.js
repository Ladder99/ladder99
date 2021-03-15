export class Cache {
  constructor() {
    this._map = new Map()
  }
  save(obj) {
    for (const datum of obj.data) {
      this._map.set(datum.key, datum)
    }
    //. call the shdr update fn - for each shdr value change calls sendToOutput
    // updateShdr()
  }
}
