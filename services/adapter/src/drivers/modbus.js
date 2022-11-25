// modbus driver

import ModbusRTU from 'modbus-serial' // see https://github.com/yaacov/node-modbus-serial

export class AdapterDriver {
  //
  async start({ device, cache, source, schema }) {
    //
    console.log('Modbus init', device.id)
    this.device = device
    this.cache = cache
    this.source = source
    this.schema = schema

    this.host = source?.connect?.host
    this.port = source?.connect?.port ?? 502

    this.inputs = schema?.inputs?.inputs || [] // array of { key, address }
    console.log('Modbus inputs', this.inputs)

    try {
      this.client = await this.getClient() // connect to server
    } catch (error) {
      console.error('Modbus connection error', error)
      return
    }

    console.log(`Modbus connected`)
    this.setValue('avail', 'AVAILABLE') // connected successfully

    // set the client's unit id [?]
    // this.client.setID(1)

    // set a timout for requests - default is null (no timeout)
    this.client.setTimeout(1000)

    //. note: can't do a plain setInterval poll - need to wait for the previous one to finish
    this.poll()
  }

  async getClient() {
    console.log(`Modbus connecting to`, this.host, this.port)
    return new Promise((resolve, reject) => {
      const client = new ModbusRTU()
      client
        .connectTCP(this.host, { port: this.port })
        .then(() => resolve(client))
        .catch(error => reject(error))
    })
  }

  async poll() {
    console.log('Modbus poll')
    for (let input of this.inputs) {
      const { key, address, count } = input
      const data = await this.getHoldingRegisters(address, count)
      console.log('Modbus values', data)
      const value = data[0] | (data[1] << 16)
      this.setValue(key, value)
    }
  }

  async getHoldingRegisters(address, count) {
    console.log(`Modbus read holding registers at ${address}, count ${count}`)
    return new Promise((resolve, reject) => {
      this.client
        .readHoldingRegisters(address, count)
        .then(response => resolve(response.data))
        .catch(error => reject(error))
    })
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
