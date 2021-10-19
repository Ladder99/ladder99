export class Clock {
  constructor() {
    this.startTimes = {} //. per device_id
  }

  // start clock for the given observation
  start(observation) {
    const { device_id, key } = observation
    if (this.startTimes[device_id] === undefined) {
      this.startTimes[device_id] = {}
    }
    // (add guard in case agent sends same value again)
    if (this.startTimes[device_id][key] === undefined) {
      this.startTimes[device_id][key] = observation.seconds1970
    }
  }

  // stop clock for given observation, return time delta in seconds
  stop(observation) {
    const { device_id, key } = observation
    let seconds
    if (this.startTimes[device_id] !== undefined) {
      if (this.startTimes[device_id][key] !== undefined) {
        seconds = observation.seconds1970 - this.startTimes[device_id][key]
        // clear the clock
        delete this.startTimes[device_id][key]
      }
    }
    return seconds
  }

  // clear clock for given observation
  clear(observation) {
    const { device_id, key } = observation
    if (this.startTimes[device_id] !== undefined) {
      delete this.startTimes[device_id][key]
    }
  }

  clearAll() {
    // this.startTimes
  }
}
