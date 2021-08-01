// cpc autoclave driver

import net from 'net' // node lib for tcp - https://nodejs.org/api/net.html

export class AdapterDriver {
  constructor() {
    this.keys = []
    this.keysStr = ''
    this.query = ''
    this.ids = []
  }

  init({ deviceId, protocol, host, port, cache, inputs, socket }) {
    // get query keys and string
    // this.query = `PathListGet:ReadValues:.Autoclave.Inputs.AIRTC\\Value,.Autoclave.RecipeProcessor\\RunStatus`
    // this.query = `PathListGet:ReadValues:.Autoclave.Variables.OperatorName\\Value`
    // eg ' PathListGet:ReadValues:.Autoclave.Alarms.ControlPower\Condition,.Autoclave.Alarms.ControlPower\AlarmActive,.Autoclave.Variables.OperatorName\Value,.Autoclave.Scripts.MotorHours.CoolPumpAOn\Value,.Autoclave.RecipeProcessor.Recipe.RecipeData\Description,.Autoclave.Inputs.AIRTC\Value'
    this.ids = inputs.inputs.map(input => `${deviceId}-${input.key}`)
    this.paths = inputs.inputs.map(input => input.path).join(',')
    this.query = `PathListGet:ReadValues:${this.paths}`
    console.log('ids', this.ids)
    console.log('paths', this.paths)

    console.log(`CPC driver connecting to TCP server at`, { host, port }, '...')
    const client = net.connect(port, host)

    // connected to device - poll it for data
    client.on('connect', () => {
      console.log(`CPC driver connected...`)
      poll(this.query)
      // setInterval(poll.bind(null, this.query), 2000)
    })

    // receive data from device, write to cache
    client.on('data', data => {
      // get str eg 'PathListGet:ReadValues:=,True,Joshau Schneider,254.280816,,0'
      const str = data.toString()
      console.log(`CPC driver received ${str}...`)
      // get values eg ['', 'True', 'Joshau Schneider', ...]
      const [_, valuesStr] = str.split(':=')
      const values = valuesStr.split(',')
      // write values to cache, which will output shdr
      this.ids.forEach((id, i) => {
        const value = values[i]
        cache.set(id, { value })
      })
    })

    client.on('error', error => {
      console.log(error)
    })

    client.on('end', () => {
      console.log('CPC driver disconnected from server...')
    })

    // 'poll' device using tcp client.write
    function poll(query) {
      console.log(`CPC driver writing ${query}...`)
      client.write(query + '\r\n')
    }
  }
}
