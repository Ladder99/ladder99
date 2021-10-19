export class Clock {
  constructor() {
    this.startTimes = {} // per device_id, then name
  }

  // start clock for the given observation
  start(observation) {
    const { device_id, name } = observation
    if (this.startTimes[device_id] === undefined) {
      this.startTimes[device_id] = {}
    }
    // (add guard in case agent sends same value again)
    if (this.startTimes[device_id][name] === undefined) {
      this.startTimes[device_id][name] = observation.seconds1970
    }
  }

  // stop clock for given observation, return time delta in seconds
  stop(observation) {
    const { device_id, name } = observation
    let seconds
    if (this.startTimes[device_id] !== undefined) {
      if (this.startTimes[device_id][name] !== undefined) {
        seconds = observation.seconds1970 - this.startTimes[device_id][name]
        // clear the clock
        delete this.startTimes[device_id][name]
      }
    }
    return seconds
  }

  // clear clock for given observation
  clear(observation) {
    const { device_id, name } = observation
    if (this.startTimes[device_id] !== undefined) {
      delete this.startTimes[device_id][name]
    }
  }

  restartAll(observation) {
    const { device_id, seconds1970 } = observation
    const clocks = this.startTimes[device_id]
    if (clocks !== undefined) {
      for (let name of Object.keys(clocks)) {
        clocks[name] = seconds1970
      }
    }
  }
}
