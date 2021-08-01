// cpc autoclave driver

import net from 'net' // node lib for tcp - https://nodejs.org/api/net.html

export class AdapterDriver {
  constructor() {
    this.keys = []
    this.keysStr = ''
    this.query = ''
  }

  init({ deviceId, protocol, host, port, cache, inputs, socket }) {
    // get query keys and string
    // eg ' PathListGet:ReadValues:.Autoclave.Alarms.ControlPower\Condition,.Autoclave.Alarms.ControlPower\AlarmActive,.Autoclave.Variables.OperatorName\Value,.Autoclave.Scripts.MotorHours.CoolPumpAOn\Value,.Autoclave.RecipeProcessor.Recipe.RecipeData\Description,.Autoclave.Inputs.AIRTC\Value'
    this.keys = inputs.inputs.map(input => input.path)
    this.keysStr = this.keys.join(',')
    this.query = `PathListGet:ReadValues:${this.keysStr}`
    // this.query = `PathListGet:ReadValues:.Autoclave.Inputs.AIRTC\\Value,.Autoclave.RecipeProcessor\\RunStatus`
    // this.query = `PathListGet:ReadValues:.Autoclave.Variables.OperatorName\\Value`

    console.log(`CPC driver connecting to TCP server at`, { host, port }, '...')
    const client = net.connect(port, host)

    client.on('error', error => {
      console.log(error)
    })

    client.on('end', () => {
      console.log('CPC driver disconnected from server...')
    })

    client.on('connect', () => {
      console.log(`CPC driver connected...`)
      poll(this.query)
      // setInterval(poll.bind(null, this.query), 2000)
    })

    client.on('data', data => {
      const str = data.toString()
      console.log(`CPC driver received ${str}...`)
      // eg 'PathListGet:ReadValues:=,True,Joshau Schneider,254.280816,,0'
      //. write values to cache, which will output shdr
      const [_, str2] = str.split(':=')
      const values = str2.split(',')

      // const pairs = {}
      // this.keys.forEach((key, i) => (pairs[key] = values[i]))
      // console.log(pairs)

      for (let [key, i] of this.keys) {
        const value = values[i]
        cache.set(key, value)
      }
    })

    // 'poll' endpoint using tcp client.write
    function poll(query) {
      console.log(`CPC driver writing ${query}...`)
      client.write(query + '\r\n')
    }
  }
}
