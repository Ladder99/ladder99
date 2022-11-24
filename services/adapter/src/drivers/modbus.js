// modbus driver

import ModbusRTU from 'modbus-serial'

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
    this.url = source?.connect?.url
    this.port = source?.connect?.port || 502

    // console.log('Modbus inputs', this.inputs)
    // this.subscriptions = []

    this.session = await this.getSession() // connect to server
    this.setValue('avail', 'AVAILABLE') // connected successfully

    // // iterate over inputs, fetch latest values, write to cache
    // for (let input of this.inputs) {
    //   const subscription = this.subscribe(input)
    //   this.subscriptions.push(subscription)
    // }
  }

  async getSession() {
    return new Promise((resolve, reject) => {
      const session = new ModbusRTU()
      session
        // .connectTCP(this.url, { port: this.port })
        .connectTCP(this.url)
        .then(function () {
          resolve(session)
        })
        .catch(function (e) {
          reject(e)
        })
    })
  }

  // foo() {
  //   // set the client's unit id
  //   // set a timout for requests default is null (no timeout)
  //   this.client.setID(1)
  //   this.client.setTimeout(1000)

  //   this.client
  //     .readHoldingRegisters(5, 4)
  //     .then(function (d) {
  //       console.log('Receive:', d.data)
  //     })
  //     .catch(function (e) {
  //       console.log(e.message)
  //     })
  //   // .then(readCoils)
  // }

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
