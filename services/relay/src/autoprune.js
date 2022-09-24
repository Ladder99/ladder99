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
    console.log(`Autoprune - start job scheduler for`, this.when)
    // schedule.scheduleJob(this.when, this.prune.bind(this)) // eg call prune once a week
    this.prune() //. test
  }

  // prune old data from db based on retention schedules in setup.yaml.
  // note: setup.relay doesn't have to be there - hence setup?.relay.
  async prune() {
    console.log(`Autoprune - pruning old data...`)
    const plans = [] // for tree/array of plan objects - [{ retention, clauses, parent }, ....]
    this.getPlans(plans, this.setup?.relay) // recurses setup, starting at relay setting
    console.log(`Autoprune - plans`, plans)
    // const sql = this.getSql(plans) // now delete the data
    // await this.db.query(sql)
    await this.deletePlans(plans) // now delete the data
    //. vacuum analyze
    // await this.db.query(`VACUUM ANALYZE`)
  }

  // get tree/list of plan objects recursively,
  // like { retention:'1wk', clauses:['1=1',...], parent: null}.
  // plans is the growing list of plan objects.
  // config is like { id|alias, retention, [nextlevel] },
  // level is the current config level, eg 'dataitems',
  // parent is the parent config object.
  async getPlans(plans, config = {}, level = 'relay', parent = null) {
    //
    const retention = config.retention // eg '1wk' or undefined

    // if this level specifies a retention, add a new plan object to the list
    if (retention) {
      // make a plan object for this level
      const clause = this.getClause(config, level, parent) // eg `path like 'Main/Micro'` or `1=1` etc
      const clauses = [clause]
      const plan = { retention, clauses, parent }
      plans.push(plan)

      // // add negation as an exception to any parent filters, recursing upwards
      // if (parent) {
      //   const exception = 'not ' + clause //. see if this works
      //   this.addException(plans, parent, exception) // recurse up the tree
      // }
    }

    // get new axis to recurse down, if any, eg 'relay' -> 'agents'
    const getChildLevel = {
      relay: 'agents',
      agents: 'devices',
      devices: 'dataitems',
      dataitems: null,
    }
    const childLevel = getChildLevel[level]

    if (childLevel) {
      // get child config items - eg agents, devices, dataitems
      const childConfigs = config[childLevel] // eg config['agents'] = [{alias:'Main',...},...]
      const childParent = config
      // recurse down child configs, if any
      for (let childConfig of childConfigs || []) {
        this.getPlans(plans, childConfig, childLevel, childParent) // recurse down the tree
      }
    }
  }

  // get a where clause for 'select node_id from dataitems where ...' query
  getClause(config, level, parent) {
    if (level === 'relay') {
      return '1=1' // match ALL dataitems
      //
    } else if (level === 'agents') {
      return `path like '${config.alias}/%'` // match agent alias, eg 'Main/%'
      //
    } else if (level === 'devices') {
      if (config.alias) {
        return `path like '${parent.alias}/${config.alias}/%'` // match device alias, eg 'Main/Micro/%'
      } else if (config.id) {
        return `props->>'contextId' = '${parent.alias}/${config.id}` // match device contextId, eg 'Main/m'
      }
      //
    } else if (level === 'dataitems') {
      return `props->>'id = '${config.id}'` // match dataitem id, eg 'm-avail'
    }
  }

  // add exception to parent filters
  addException(plans, parent, exception) {
    if (parent) {
      console.log('parent', parent)
      parent.clauses.push(exception)
      this.addException(plans, parent.parent, exception) // recurse up the tree
    }
  }

  // // get a set of nodes for a given clause
  // async getNodeIds(clause = '1=1') {
  //   const result = await this.db.query(
  //     `select node_id from dataitems where ${clause}`
  //   )
  //   // extract set of node_ids from rows
  //   const nodeIdList = (result.rows || []).map(row => row.node_id)
  //   const nodeIds = new Set(nodeIdList)
  //   return nodeIds
  // }

  // delete data from database
  async deletePlans(plans) {
    console.log(`Autoprune - delete data`)
    for (let plan of plans) {
      const clauses = plan.clauses.map(clause => `(${clause})`).join(' and ')
      const sql = `
        DELETE FROM raw.history 
        WHERE ?
        AND timestamp < now() - ?::interval
        `
      const values = [clauses, plan.retention]
      console.log('Autoprune sql', sql, values)
      // await this.db.query(sql, values)
    }
  }
}
