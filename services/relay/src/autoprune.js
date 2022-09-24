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
    schedule.scheduleJob(this.when, this.prune.bind(this)) // eg call prune once a week
  }

  // prune old data from db based on retention schedules in setup.yaml.
  // note: setup.relay doesn't have to be there - hence setup?.relay.
  async prune() {
    const plans = [] // for tree/array of plan objects - [{ retention, clauses, parent }, ....]
    this.getPlans(plans, this.setup?.relay) // recurses setup, starting at relay setting
    this.deleteData(plans) // now delete the data
  }

  // get tree/array of plan objects like { retention:'1wk', clauses:['1=1',...], parent: null}.
  // config should have { id|alias, retention, [nextlevel] },
  // where level is the current config level, eg with 'dataitems',
  //   { alias: 'Micro', retention: '1wk', dataitems: [...]},
  async getPlans(plans, config = {}, level = 'relay', parent = null) {
    //
    const retention = config.retention // eg '1wk' or undefined

    if (retention) {
      // create plan object for this level
      //. could match on alias or id -
      //. for now, assume we have a device alias.
      const match = 0
      // const clause = `path like '${agent.alias}%'` //. eg
      const clause = this.getClause(config, level)
      const clauses = [clause]
      const plan = { retention, clauses, parent }
      plans.push(plan)

      // add clause as an exception to parent filters, recursing upwards
      const exception = 'not ' + clause
      if (parent) {
        this.addException(plans, parent, exception) // recurse up the tree
      }
    }

    // get new axis to recurse down, if any
    const getNextLevel = {
      relay: 'agents',
      agents: 'devices',
      devices: 'dataitems',
      dataitems: null,
    }
    const nextLevel = getNextLevel[level]
    if (!nextLevel) return // we're done

    // recurse down child configs, eg agents, devices, dataitems
    const childConfigs = config[nextLevel] || []
    for (let childConfig of childConfigs) {
      // call with config as parent
      this.getPlans(plans, childConfig, nextLevel, config) // recurse down the tree
    }
  }

  // add exception to parent filters
  addException(plans, parent, exception) {
    if (parent) {
      parent.clauses.push(exception)
      this.addException(plans, parent.parent, exception) // recurse up the tree
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
