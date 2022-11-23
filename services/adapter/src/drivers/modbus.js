// modbus driver

export class AdapterDriver {
  //
  async start({ device, cache, source, schema }) {
    //
    console.log('Modbus init', device.id)
    this.device = device
    this.cache = cache
    this.source = source
    this.schema = schema
    // this.inputs = schema?.inputs?.inputs || [] // array of { key, nodeId }
    // this.url = source?.connect?.url ?? defaultUrl
    // console.log('Modbus inputs', this.inputs)
    // this.subscriptions = []

    // this.setValue('avail', 'UNAVAILABLE') // write to cache
    // this.session = await this.getOPCSession() // connect to opc server
    this.setValue('avail', 'AVAILABLE') // connected successfully

    // // iterate over inputs, fetch latest values, write to cache
    // for (let input of this.inputs) {
    //   const subscription = this.subscribe(input)
    //   this.subscriptions.push(subscription)
    // }
  }

  // helper methods

  setValue(key, value) {
    const id = this.device.id + '-' + key
    this.cache.set(id, value)
  }
}

// helper fns

async function timeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
