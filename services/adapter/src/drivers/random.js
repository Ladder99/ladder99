// random data driver - for testing

// run with
//   ./start ./setups/random adapter agent

const pollInterval = 1000 // msec

export class AdapterDriver {
  start({ device }) {
    console.log(`Random - start driver...`)

    setInterval(poll.bind(this), pollInterval)

    let previous = {}

    // send data directly to agent as shdr - ie skip cache for now.
    // these should only send something if value CHANGED.
    async function poll() {
      console.log(`Random poll - send data to agent if have socket...`)

      // only do once socket is available - see setSocket below
      if (this.socket) {
        const availability = Math.random() > 0.5 ? 'AVAILABLE' : 'UNAVAILABLE'
        const execution =
          availability === 'AVAILABLE'
            ? Math.random() > 0.5
              ? 'ACTIVE'
              : 'WAIT'
            : 'WAIT'
        const operator = Math.random() > 0.5 ? 'Alice' : 'Bob'

        // yes, this works without timestamp
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
        if (shdr.length > 0) {
          console.log('Random shdr', shdr)
          this.socket.write(shdr + '\n') // write to agent
        }

        previous = { availability, execution, operator }
      }
    }
  }

  // set socket to agent once connection is established
  setSocket(socket) {
    console.log(`Random - set socket`)
    this.socket = socket
  }
}
