// http-json driver

// polls data from http, parses as json

import fetch from 'node-fetch' // https://github.com/node-fetch/node-fetch

export class AdapterDriver {
  start({ device, protocol, host, port }) {
    const url = `${protocol}://${host}:${port}` // eg http://play:8080
    console.log('start test plugin', device.id, url)

    const timer = setInterval(poll, 1000)

    //. poll device, send data directly to agent as shdr for now
    //. hmm, if fetch connection broke, this would start piling up awaiting fn calls -
    //  how avoid that?
    async function poll() {
      if (this.socket) {
        try {
          const response = await fetch(url)
          const text = await response.text()
          const json = JSON.parse(text)
          console.log(json)
          //.
          const value = json.status === 'online' ? 'AVAILABLE' : 'UNAVAILABLE'
          const shdr = `|${device.id}-connection|${value}` //..
          console.log(shdr)
          this.socket.write(shdr + '\n')
        } catch (error) {
          if (error.code === 'ECONNREFUSED') {
            // ignore - will try again
          } else {
            throw error
          }
        }
      }
    }
  }

  setSocket(socket) {
    this.socket = socket
  }
}
