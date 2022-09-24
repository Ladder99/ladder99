// autoprune removes old historical data on a retention schedule.
// one autoprune instance per agent.

import schedule from 'node-schedule'

export class Autoprune {
  //
  constructor(params, db, agent) {
    this.params = params
    this.db = db
    this.agent = agent
    this.when = { hour: 0, minute: 0, dayOfWeek: 0 } // sunday 0:00 - ie saturday midnight
  }

  start() {
    //
    schedule.scheduleJob(this.when, this.prune.bind(this))
  }

  prune() {
    //. check relay, agent, device, dataitem retention values
    const relayRetention = setup.relay.retention // eg '1wk' or null
    for (let agent of setup.relay.agents || []) {
      const agentRetention = agent.retention || relayRetention // eg '1wk' or null
      for (let device of agent.devices || []) {
        const deviceRetention = device.retention || agentRetention // eg '1wk' or null
        for (let dataitem of device.dataitems || []) {
          const dataitemRetention = dataitem.retention
          // delete data from database
        }
      }
    }
  }
}
