// cpc autoclave driver

// CPC (Composite Processing Control) is ASC's flagship software and
// control system designed specifically for control of composite
// processes in autoclaves, ovens, presses, formers, and bond tools.
// Since its creation, CPC has been at the forefront of composite technology.
// CPC has evolved over the last 31-years and is now the leader in the
// control of autoclaves and ovens. Most Tier I, II, and III aerospace
// companies standardize their controls on CPC. Every day, more than
// 1500 pieces of equipment are controlled by CPC.

import net from 'net' // node lib for tcp - https://nodejs.org/api/net.html

//. split the polling into high and low frequency polls?
// eg low freq for the message list, since it sends back a lot of text
const pollInterval = 2000 // msec
const reconnectInterval = 5000 // msec

// these functions transform values received from cpc depending on
// the type specified in eg schemas/autoclave/asc/inputs.yaml.
const typeFns = {
  undefined: value => value,
  boolean: value => value === 'True',
  message: value => value.split('\r\n')[0], // just keep first line of msg
}

export class AdapterDriver {
  //
  async start({ device, host, port, cache, module }) {
    console.log(`CPC initialize driver...`)
    cache.set(`${device.id}-avail`, 'UNAVAILABLE')

    // save params
    this.deviceId = device.id
    this.host = host
    this.port = port
    this.cache = cache
    this.module = module

    const { inputs } = module

    // get ids and query string.
    // this query string is sent to the device each poll interval to get the values.
    // see onData method for how the values are parsed from the response.

    // get array of ids, eg ['ac1-operator_name', 'ac1-recipe_description', ...]
    this.ids = inputs.inputs.map(input => `${device.id}-${input.key}`)

    // get array of types, eg [undefined, undefined, boolean, ...]
    this.types = inputs.inputs.map(input => input.type)

    // get the cpc property path string, eg '.Autoclave.Alarms.ControlPower\Condition,...'
    this.paths = inputs.inputs.map(input => input.path).join(',')

    // get query string, eg 'PathListGet:ReadValues:.Autoclave.Alarms.ControlPower\Condition,...'
    this.query = `PathListGet:ReadValues:${this.paths}`

    console.log('CPC ids', this.ids)
    console.log('CPC query', this.query)

    // connect to device
    this.connect()
  }

  // connect to device and attach event handlers
  connect() {
    console.log(`CPC connect to TCP ${this.host}:${this.port}...`)
    this.client = net.connect(this.port, this.host) // this waits here?
    console.log(`CPC attaching listeners...`)
    // attach event handlers
    this.client.on('connect', this.onConnect.bind(this))
    this.client.on('data', this.onData.bind(this))
    this.client.on('error', this.onError.bind(this))
    this.client.on('timeout', this.onTimeout.bind(this))
    this.client.on('close', this.onClose.bind(this))
  }

  // connected to device
  onConnect() {
    console.log(`CPC connected to device ${this.deviceId}...`)
    this.cache.set(`${this.deviceId}-avail`, 'AVAILABLE')
    this.poll() // first poll
    this.timer = setInterval(this.poll.bind(this), pollInterval) // subsequent polls
  }

  // 'poll' device using tcp client.write - will receive data in 'data' events
  poll() {
    console.log(`CPC driver writing "${this.query}"`)
    //. need to tie this to the onData better somehow?
    this.client.write(this.query + '\r\n')
  }

  // receive data from device, parse to items, write to cache, outputs shdr to agent
  onData(data) {
    // get response string, eg 'PathListGet:ReadValues:=,True,Joshau Schneider,254.280816,,0'
    const str = data.toString()
    console.log(`CPC driver received "${str.slice(0, 255)}..."`)
    const valuesStr = str.split(':=')[1] // eg ',True,Joshau Schneider,254.280816,,0'
    // note: for the list of 'messages', it sends one after the other -
    // after the first one it doesn't include the :=, so this will return null.
    // so can ignore those, since we just want the first line.
    //. actually, need to glom all the received strings together, until get a \r\n?
    // THEN split them on the ':='.
    if (valuesStr) {
      const values = valuesStr.split(',') // eg ['', 'True', 'Joshau Schneider', ...]
      // write values to cache, which will output shdr to agent
      this.ids.forEach((id, i) => {
        const type = this.types[i] // eg 'boolean'
        const typeFn = typeFns[type] // eg value => value==='True'
        const value = typeFn(values[i]) // eg true
        this.cache.set(id, value) // set cache value, which triggers shdr output
      })
    }
  }

  onError(error) {
    // this includes an ETIMEDOUT error message - then calls onTimeout eh? no!
    // also ECONNRESET message
    console.log('CPC error')
    console.log(error.message)
    console.log(error)
  }

  onTimeout() {
    console.log('CPC connection timed out...')
    // this.reconnect()
  }

  async onClose(had_error) {
    console.log('CPC connection closed - set all to UNAVAILABLE...')
    const value = 'UNAVAILABLE'
    this.ids.forEach(id => {
      this.cache.set(id, value)
    })
    if (this.timer) {
      console.log(`CPC clear poll timer...`)
      clearTimeout(this.timer)
      this.timer = null
    }
    console.log(`CPC remove listeners...`)
    this.client.removeAllListeners() // clear the data, timeout etc handlers
    console.log(`CPC waiting a while to reconnect...`)
    await new Promise(resolve => setTimeout(resolve, reconnectInterval))
    this.connect()
  }
}
