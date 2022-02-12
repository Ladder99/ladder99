// example driver

export class AdapterDriver {
  init({ device, protocol, host, port, cache }) {
    console.log(`Initialize example driver...`)

    function setAvailable() {
      cache.set(`${device.id}-availability`, 'AVAILABLE')
    }

    function setUnavailable() {
      cache.set(`${device.id}-availability`, 'UNAVAILABLE')
      cache.set(`${device.id}-mass`, 'UNAVAILABLE')
    }
  }
}
