// zebra printer driver

import net from 'net' // node lib for tcp - https://nodejs.org/api/net.html

const pollInterval = 5000 // ms

export class AdapterDriver {
  init({ deviceId, protocol, host, port, cache, inputs, socket }) {
    console.log(`Initialize Zebra driver...`)

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
      console.log(`Zebra driver connecting to printer at`, { host, port }, '...')
      client = net.connect(port, host)
    } catch (err) {
      console.log(err)
      setAllUnavailable()
      //. keep trying
    }

    const commandHandlers = {
      // host query status - errors and warnings - see guide p205
      '~HQES': str => {
        if (str) {
          //. parse status into cache keyvalues
          // cache.set(`${deviceId}/avail`, { value: 'AVAILABLE' })
          // cache.set(`${deviceId}/emp`, { value: 'ON' }) // or OFF
          // cache.set(`${deviceId}/state`, { value: 'ACTIVE' }) // or READY or WAIT
          // cache.set(`${deviceId}/cond`, { value: 'WARNING' }) // or NORMAL or ERROR
          // cache.set(`${deviceId}/msg`, { value: 'Some message' })
          // cache.set(`${deviceId}/uc`, { value: 3 }) // unload count
          // cache.set(`${deviceId}/tl`, { value: 100 }) // total length
          // cache.set(`${deviceId}/fr`, { value: 10 }) // feedrate
          // cache.set(`${deviceId}/dark`, { value: 30 }) // -30 to +30 or sthing
          // cache.set(`${deviceId}/ht`, { value: 40 }) // head temp - need SGD api
        } else {
          //. set all to unavail
          setUnavailable('avail')
        }
      },
      // host query odometer - nonresettable and user resettable 1 and 2
      '~HQOD': str => {},
      // host query maintenance info - messages
      '~HQMI': str => {},
      // head diagnostic - get head temp, darkness adjust (?)
      '~HD': str => {},
      // host status
      // get paper out flag, pause flag, buffer full flag, under/over temp flags,
      // head up flag, ribbon out flag, label waiting flag
      '~HS': str => {},
    }

    // connected to device - poll it for data by writing a command
    client.on('connect', () => {
      console.log(`Zebra driver connected...`)
      // poll()
      setInterval(poll, pollInterval) //. do this
    })

    // receive data from device, write to cache, output shdr to agent
    client.on('data', data => {
      // response starts with STX, has CR LF between each line, ends with ETX
      const str = data.toString() // eg 'PRINTER STATUS ERRORS: 1 00000000 00000005 WARNINGS: 1 00000000 00000002' // zpl returns
      console.log(`Zebra driver received response:\n`, str)
      if (handler) handler(str)
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
    async function poll() {
      // iterate over cmds, set handler temporarily
      const commands = Object.keys(commandHandlers)
      for (let command of commands) {
        handler = commandHandlers[command]
        console.log(`Zebra driver writing ${command}...`)
        //. do try catch - handle disconnection, reconnection
        client.write(command + '\r\n')
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }

    function setAllUnavailable() {
      // call all the cmd handlers with no param
      const handlers = Object.values(commandHandlers)
      handlers.forEach(handler => handler())
    }

    function setUnavailable(key) {
      cache.set(`${deviceId}/${key}`, { value: 'UNAVAILABLE' })
    }
  }
}
