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

//. split the polling into high and low frequency polls -
// eg low freq for the message list, since it sends back a lot of text
const pollInterval = 2000 // msec
const reconnectInterval = 5000 // msec

// these functions transform values received from cpc depending on
// the type specified in eg modules/autoclave/asc/inputs.yaml.
const typeFns = {
  undefined: value => value,
  boolean: value => value === 'True',
  message: value => value.split('\r\n')[0], // just keep first line of msg
}

export class AdapterDriver {
  async init({ deviceId, host, port, cache, inputs }) {
    console.log(`CPC Initialize driver...`)
    cache.set(`${deviceId}-avail`, 'UNAVAILABLE')

    // save params
    this.deviceId = deviceId
    this.host = host
    this.port = port
    this.cache = cache

    // get ids and query string
    this.ids = inputs.inputs.map(input => `${deviceId}-${input.key}`) // eg ['ac1-operator_name', 'ac1-recipe_description', ...]
    this.paths = inputs.inputs.map(input => input.path).join(',') // the cpc property path string, eg '.Autoclave.Alarms.ControlPower...,...'
    this.types = inputs.inputs.map(input => input.type) // eg [undefined, undefined, boolean, ...]
    this.query = `PathListGet:ReadValues:${this.paths}` // eg 'PathListGet:ReadValues:.Autoclave.Alarms.ControlPower\Condition,...'

    console.log('CPC ids', this.ids)
    console.log('CPC query', this.query)

    const that = this

    this.connect()
  }

  // connect to device and attach event handlers
  connect() {
    console.log(`CPC driver connecting to TCP ${this.host}, ${this.port}...`)
    this.client = net.connect(this.port, this.host) // this waits here
    this.client.on('connect', this.onConnect)
    this.client.on('data', this.onData)
    this.client.on('error', this.onError)
    this.client.on('timeout', this.onTimeout)
  }

  // connected to device
  onConnect() {
    console.log(`CPC driver connected...`)
    this.cache.set(`${this.deviceId}-avail`, 'AVAILABLE')
    this.poll() // first poll
    //. cancel timer if reconnect?
    this.timer = setInterval(this.poll.bind(this), pollInterval) // subsequent polls
  }

  // receive data from device, write to cache, output shdr to agent
  onData(data) {
    const str = data.toString() // eg 'PathListGet:ReadValues:=,True,Joshau Schneider,254.280816,,0'
    console.log(`CPC driver received ${str.slice(0, 255)}...`)
    const valuesStr = str.split(':=')[1]
    // note: for the list of messages, it sends one after the other -
    // after the first one it doesn't include the :=, so this will return null.
    // so can ignore those, since we just want the first line.
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
    console.log(error)
    //. try reconnect
  }

  onClose(had_error) {
    console.log('CPC connection closed...')
    //. try reconnect
    // that.connect()
  }

  onTimeout() {
    console.log('CPC connection timed out...')
    //. try reconnect
    // wait a while and try again
    console.log(`CPC - waiting a while to try again...`)
    //.await new Promise(resolve => setTimeout(resolve, reconnectInterval))
  }

  // 'poll' device using tcp client.write - will receive data in 'data' events
  poll() {
    console.log(`CPC driver writing ${this.query}...`)
    this.client.write(this.query + '\r\n')
  }
}
