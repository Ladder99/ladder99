export class Pruner {
  constructor({ params, db, setup }) {
    this.params = params
    this.db = db
    this.setup = setup
    this.interval = 1000
  }
  start() {
    setInterval(this.prune.bind(this), this.interval)
  }
  prune() {
    //. how check time?
    // if (time is saturday midnight) {
    //   //. check relay, agent, device, dataitem retention values
    // }
  }
}
