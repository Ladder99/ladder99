// feedback driver

export class AdapterDriver {
  init({ source, device, connect, cache }) {
    console.log(`Initialize feedback driver...`)
    console.log(source)
    // function setAvailable() {
    //   cache.set(`${device.id}-availability`, 'AVAILABLE')
    // }

    // function setUnavailable() {
    //   cache.set(`${device.id}-availability`, 'UNAVAILABLE')
    //   cache.set(`${device.id}-mass`, 'UNAVAILABLE')
    // }
  }

  // this method is OPTIONAL - some drivers might need a direct connection
  // to agent, eg see random.js.
  setSocket(socket) {
    this.socket = socket
  }
}
