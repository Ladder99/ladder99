// zebra printer driver

import net from 'net' // node lib for tcp - https://nodejs.org/api/net.html

const pollInterval = 5000 // ms

const commandHandlers = {
  // status - errors and warnings
  '~HQES': str => {
    if (str) {
    } else {
      //. set to unavail
    }
  },
  // odometer - nonresettable and user resettable 1 and 2
  '~HQOD': str => {},
  // maintenance info - messages
  '~HQMI': str => {},
  // head diagnostic - get head temp, darkness adjust (?)
  '~HD': str => {},
  // host status
  // get paper out flag, pause flag, buffer full flag, under/over temp flags,
  // head up flag, ribbon out flag, label waiting flag
  '~HS': str => {},
}

export class AdapterDriver {
  init({ deviceId, protocol, host, port, cache, inputs, socket }) {
    console.log(`Initialize Zebra driver...`)

    console.log(`Zebra driver connecting to printer at`, { host, port }, '...')

    // //... for testing - delete this
    // // set cache values, which trigger shdr output
    // cache.set(`${deviceId}/avail`, { value: 'AVAILABLE' }) // or UNAVAILABLE
    // cache.set(`${deviceId}/emp`, { value: 'ON' }) // or OFF
    // cache.set(`${deviceId}/state`, { value: 'ACTIVE' }) // or READY or WAIT
    // cache.set(`${deviceId}/cond`, { value: 'WARNING' }) // or NORMAL or ERROR
    // cache.set(`${deviceId}/msg`, { value: 'Some message' })
    // cache.set(`${deviceId}/uc`, { value: 3 }) // unload count
    // cache.set(`${deviceId}/tl`, { value: 100 }) // total length
    // cache.set(`${deviceId}/fr`, { value: 10 }) // feedrate
    // cache.set(`${deviceId}/dark`, { value: 30 }) // -30 to +30 or sthing
    // cache.set(`${deviceId}/ht`, { value: 40 }) // head temp - need SGD api

    let client
    let handler
    try {
      client = net.connect(port, host)
    } catch (err) {
      console.log(err)
      //. set all values to UNAVAILABLE
      //. keep trying
    }

    // connected to device - poll it for data by writing a command
    client.on('connect', () => {
      console.log(`Zebra driver connected...`)
      // poll()
      setInterval(poll, pollInterval) //. do this
    })

    // command to get printer status
    // const cmd = `! U1 getvar "zpl.system_status"` // doesn't work on old printer
    const cmd = `~HQES` // host query - see zpl programming guide p205 - works on old and new printers

    // receive data from device, write to cache, output shdr to agent
    client.on('data', data => {
      // const str = data.toString() // eg '0,0,00000000,00000000,0,00000000,00000000' // sgd returns
      // response starts with STX, has CR LF between each line, ends with ETX
      const str = data.toString() // eg 'PRINTER STATUS ERRORS: 1 00000000 00000005 WARNINGS: 1 00000000 00000002' // zpl returns
      console.log(`Zebra driver received response:\n`, str)
      if (handler) handler(str)
      //. parse status into cache keyvalues
      // const id = `${deviceId}/avail`
      // const value = 'AVAILABLE'
      // cache.set(id, { value }) // set cache value, which triggers shdr output
    })
    client.on('error', error => {
      console.log(error)
      //. set all values to UNAVAILABLE
    })
    client.on('end', () => {
      console.log('Zebra driver disconnected from server...')
      //. set all values to UNAVAILABLE
      //. try to reconnect
    })
    // 'poll' device using tcp client.write
    function poll() {
      //. iterate over cmds, set handler temporarily
      //. handler = commandHandler
      console.log(`Zebra driver writing ${cmd}...`)
      //. do try catch - handle disconnection, reconnection
      client.write(cmd + '\r\n')
    }
    function setUnavailable() {
      //. maybe call all the cmd parsers with blank str?
    }
  }
}
