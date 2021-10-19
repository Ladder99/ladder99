export class Clock {
  constructor(tracker) {
    this.startTimes = {}
  }

  // start clock for the given observation
  start(observation) {
    const { key } = observation
    // add guard in case agent sends same value again
    if (this.startTimes[key] === undefined) {
      this.startTimes[key] = observation.seconds1970
    }
  }

  // stop clock for given observation, return time delta in seconds
  stop(observation) {
    const { key } = observation
    let seconds
    if (this.startTimes[key] !== undefined) {
      seconds = observation.seconds1970 - this.startTimes[key]
      // clear the clock
      delete this.startTimes[key]
    }
    return seconds
  }

  clear(observation) {
    delete this.startTimes[observation.key]
  }
}
