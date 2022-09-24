// autoprune removes old historical data on a retention schedule.
// one autoprune instance per agent.

import schedule from 'node-schedule'

export class Autoprune {
  //
  constructor(params, db, setup) {
    this.params = params
    this.db = db
    this.setup = setup
    this.when = { hour: 0, minute: 0, dayOfWeek: 0 } // sunday 0:00 - ie saturday midnight
  }

  // start the autoprune timer
  start() {
    schedule.scheduleJob(this.when, this.prune.bind(this)) // eg once a week
  }

  // remove old data from db based on retention schedules in setup.yaml.
  // note: setup.relay doesn't have to be there - hence setup?.relay.
  async prune() {
    // get tree array of plan objects - [{ retention, clauses, parent }, ....]
    const plans = []
    this.getPlans(plans, this.setup?.relay) // recurses setup, starting at relay setting

    // once we get the plan objects, we can delete old data from the db
    this.deleteData(plans)
  }

  // foo() {
  //   // if relay retention is specified, get node_ids for ALL dataitems in all agents.
  //   let retention = setup?.relay?.retention // eg '1wk' or null
  //   if (retention) {
  //     const clauses = ['1=1'] // ALL dataitems
  //     const plan = { clauses, retention }
  //     plans.push(plan)
  //   }

  //   // iterate over any agents specified
  //   for (let agent of setup?.relay?.agents || []) {
  //     // see if agent has a different retention specified -
  //     // if so, add a plan object with node_ids and retention.
  //     retention = agent.retention // eg '1wk' or null
  //     if (retention) {
  //       // add exception to parent filters
  //       const exception = `path not like '${agent.alias}%'`
  //       for (let plan of plans) {
  //         plan.clauses.push(exception)
  //       }
  //       // add clause to current agent filter
  //       const clause = `path like '${agent.alias}%'`
  //       const plan = { clauses: [clause], retention }
  //       plans.push(plan)
  //     }

  //     // iterate over any devices specified
  //     for (let device of agent.devices || []) {
  //       // see if device has a different retention specified -
  //       // if so, add a plan object with clauses and retention.
  //       retention = device.retention // eg '1wk' or null

  //       if (retention) {
  //         //. could match on deviceAlias or deviceId -
  //         //. for now, assume we have a device alias.
  //         const clause = `path like '${agent.alias}/${device.alias}%'`
  //         const exception = `path not like '${agent.alias}/${device.alias}%'`
  //         const plan = { clauses: [clause], retention }
  //         plans.push(plan)
  //         // add exception to parent filters
  //         for (let parent of plans.slice(0, -1)) {
  //           parent.clauses.push(exception)
  //         }
  //       }

  //       // iterate over any dataitems specified
  //       for (let dataitem of device.dataitems || []) {
  //         const dataitemRetention = dataitem.retention
  //       }
  //     }
  //   }
  // }

  // get array of plan objects - ieg [{ retention:'1wk', clauses:['1=1',...], parent: null}, ...]
  // config should have { id|alias, retention, [childprop] } -
  // eg { alias: 'Micro', retention: '1wk', dataitems: [...]}.
  // recurses down config tree.
  async getPlans(plans, config = {}, childprop = 'agents', parent = null) {
    //
    const retention = config.retention // eg '1wk' or undefined
    if (retention) {
      const clauses = ['1=1'] // ALL dataitems
      const parent = config
      const plan = { retention, clauses, parent }
      plans.push(plan)
    }

    // choose new axis to recurse down
    if (childprop === 'agents') {
      childprop = 'devices'
    } else if (childprop === 'devices') {
      childprop = 'dataitems'
    }

    // iterate over any child configs, eg agents, devices, dataitems
    const children = config[childprop] || []
    for (let child of children) {
      this.getPlans(plans, child, childprop, config)
    }

    // see if level has a different retention specified -
    // if so, add a prune object with node_ids and retention.
    retention = agent.retention // eg '1wk' or null
    if (retention) {
      // add clause to current agent filter
      const clause = `path like '${agent.alias}%'`
      const plan = { clauses: [clause], retention }
      plans.push(plan)
      // add exception to parent filters
      const exception = `path not like '${agent.alias}%'`
      if (parent) {
        //. recurse up the tree
        this.addException(plans, parent, exception)
      }
    }

    // recurse over any children specified
    for (let device of agent.devices || []) {
      // see if device has a different retention specified -
      // if so, add a prune object with clauses and retention.
      retention = device.retention // eg '1wk' or null

      if (retention) {
        //. could match on deviceAlias or deviceId -
        //. for now, assume we have a device alias.
        const clause = `path like '${agent.alias}/${device.alias}%'`
        const exception = `path not like '${agent.alias}/${device.alias}%'`
        const plan = { clauses: [clause], retention }
        plans.push(plan)
        // add exception to parent filters
        for (let parent of plans.slice(0, -1)) {
          parent.clauses.push(exception)
        }
      }
    }
  }

  // add exception to parent filters
  addException(plans, parent, exception) {
    for (let plan of plans) {
      if (plan.parent === parent) {
        prune.clauses.push(exception)
      }
    }
  }

  // get a set of nodes for a given clause
  async getNodeIds(clause = '1=1') {
    const result = await this.db.query(
      `select node_id from dataitems where ${clause}`
    )
    // extract set of node_ids from rows
    const nodeIdList = (result.rows || []).map(row => row.node_id)
    const nodeIds = new Set(nodeIdList)
    return nodeIds
  }

  // delete data from database
  async deleteData(plans) {
    for (let plan of plans) {
      const sql = `
        DELETE FROM raw.history 
        WHERE node_id IN (?) AND timestamp < now() - ?::interval
        `
      const values = [nodeIds, plan.retention]
      console.log('sql', sql, values)
      // await this.db.query(sql, values)
    }
  }
}
