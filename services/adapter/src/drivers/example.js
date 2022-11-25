// example driver

export class AdapterDriver {
  start({ device, cache }) {
    console.log(`Initialize example driver...`)

    function setAvailable() {
      cache.set(`${device.id}-avail`, 'AVAILABLE')
    }

    function setUnavailable() {
      cache.set(`${device.id}-avail`, 'UNAVAILABLE')
      cache.set(`${device.id}-mass`, 'UNAVAILABLE')
    }
  }

  // this method is OPTIONAL - some drivers might need a direct connection
  // to agent, eg see random.js.
  setSocket(socket) {
    this.socket = socket
  }
}
