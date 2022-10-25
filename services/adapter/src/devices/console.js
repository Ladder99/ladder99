export class Device {
  start(stream) {
    console.log(`Console - initialize device...`)
    this.stream = stream
  }

  // admit an event and print it to the console
  admit(event) {
    console.log(event)
  }

  // ignore emit events
  emit() {}
}
