// random data driver - for testing

const pollInterval = 1000 // msec

export class AdapterDriver {
  init({ device }) {
    console.log(`Initialize Random driver...`)

    const timer = setInterval(poll, pollInterval)

    let previous = {}

    // send data directly to agent as shdr - ie skip the cache for now
    //. these should only send something if value CHANGED
    async function poll() {
      const timestamp = new Date().toISOString()
      const availability = Math.random() > 0.5 ? 'AVAILABLE' : 'UNAVAILABLE'
      const execution =
        availability === 'AVAILABLE'
          ? Math.random() > 0.5
            ? 'ACTIVE'
            : 'WAIT'
          : 'WAIT'
      const operator = Math.random() > 0.5 ? 'Alice' : 'Bob'

      let shdr = ''
      if (availability !== previous.availability) {
        shdr += `|${device.id}-availability|${availability}`
      }
      if (execution !== previous.execution) {
        shdr += `|${device.id}-execution|${execution}`
      }
      if (operator !== previous.operator) {
        shdr += `|${device.id}-operator|${operator}`
      }
      if (shdr.length > 0 && this.socket) {
        shdr = timestamp + shdr
        console.log(shdr)
        this.socket.write(shdr + '\n') // write to agent
      }

      previous = { availability, execution, operator }
    }
  }

  setSocket(socket) {
    this.socket = socket
  }
}
