// random data driver - for testing

const pollInterval = 1000 // msec

export class AdapterDriver {
  init({ device }) {
    console.log(`Random - initialize driver...`)

    const timer = setInterval(poll, pollInterval)

    let previous = {}

    // send data directly to agent as shdr - ie skip cache for now.
    // these should only send something if value CHANGED.
    async function poll() {
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
        console.log('Random shdr', shdr)
        this.socket.write(shdr + '\n') // write to agent
      }

      previous = { availability, execution, operator }
    }
  }

  setSocket(socket) {
    this.socket = socket
  }
}
