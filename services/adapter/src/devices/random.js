// random device - emits random number events at some interval, for testing.
// an event is an object with { path, time, value }.

const emitInterval = 1000 // msec

export class Device {
  start(stream) {
    console.log(`Random - initialize device...`)
    this.stream = stream
    this.emit()
    setInterval(this.emit.bind(this), emitInterval)
  }

  // emit a random number event
  emit() {
    const path = 'random'
    const time = Date.now() // ms since epoch
    const value = Math.random()
    const event = { path, time, value }
    this.stream.push(event) //?
  }

  // ignore admit events
  admit(event) {}
}
