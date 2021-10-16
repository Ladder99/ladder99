const timeout = 1000 // dump bins every minute

export class Bins {
  constructor() {
    this.timer = null
  }
  start() {
    this.timer = setInterval(this.handler, timeout)
  }
  handler() {
    console.log('handler')
    //. dump bins to db
    //. clear bins
  }
}
