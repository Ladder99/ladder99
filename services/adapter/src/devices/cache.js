export class Device {
  start(stream) {
    console.log(`Console - initialize device...`)
    this.stream = stream
    this.cache = {} //. make this a reactive cache
  }

  // admit an event and write it to the cache, which can trigger an action
  admit(event) {}

  // emit an event
  emit() {}
}
