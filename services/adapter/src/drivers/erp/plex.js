// plex erp driver

// import fetch from 'node-fetch' // https://github.com/node-fetch/node-fetch

const pollInterval = 1000 // msec
const reconnectInterval = 5000 // msec

export class AdapterDriver {
  start({ device, protocol, host, port }) {
    console.log(`Plex ERP start driver...`)

    const url = `${protocol}://${host}:${port}` // eg http://play:8080
    console.log('Plex start test plugin', device.id, url)

    const timer = setInterval(poll, pollInterval)

    //. poll erp, send data directly to agent as shdr
    // ie skip the cache for now
    async function poll() {
      if (this.socket) {
        const value = Math.random() > 0.5 ? 'AVAILABLE' : 'UNAVAILABLE'
        const shdr = `|${device.id}-availability|${value}`
        console.log(shdr)
        this.socket.write(shdr + '\n') // write to agent
      }
    }
  }

  setSocket(socket) {
    this.socket = socket
  }
}
