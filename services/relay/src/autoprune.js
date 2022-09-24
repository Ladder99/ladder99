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
    this.prune() //. direct testing
  }

  // prune old data from db based on retention schedules in setup.yaml.
  // note: setup.relay doesn't have to be there - hence setup?.relay.
  async prune() {
    console.log(`Autoprune - pruning old data...`)
    // const plans = [] // for tree/array of plan objects - [{ retention, clauses, parent }, ....]
    // this.getPlans(plans, this.setup?.relay) // recurses setup, starting at relay setting
    // console.log(`Autoprune - plans`, plans)

    // add plan clauses and parent links to setup tree
    // eg adds this.setup.relay.clauses, this.setup.relay.parent
    this.addPlans(this.setup, 'relay') // recurse setup, starting at relay setting

    this.addSql(this.setup)

    console.log(`Autoprune - setup`, this.setup.relay)

    // await this.deletePlans(plans) // now delete the data

    //. vacuum analyze
    // await this.db.query(`VACUUM ANALYZE`)
    process.exit(0) //.
  }

  // get tree/list of plan objects recursively,
  // like { retention:'1wk', clauses:['1=1',...], parent: null}.
  // plans is the growing list of plan objects.
  // config is like { id|alias, retention, [nextLevel] },
  // level is the current config level, eg 'dataitems',
  // parent is the parent config/setup object.
  async addPlans(setup, level, parent = null) {
    console.log('addPlans', level, parent?.alias)
    //
    const config = setup[level] // includes { id|alias, retention, [nextLevel] }
    const retention = config.retention // eg '1wk' or undefined

    // if this level specifies a retention, add an autoprune object to the setup tree
    if (retention) {
      // get where clause differently depending on setup level
      const clause = this.getWhereClause(config, level, parent) // eg `path like 'Main/Micro'` or `1=1` etc
      const clauses = [clause]

      // start autoprune object for this level
      config.autoprune = { level, clauses, retention, parent }

      // add negation as an exception to any parent filters, recursing upwards
      const exception = 'not ' + clause //. will this work?
      while (parent) {
        if (parent.clauses) {
          parent.clauses.push(exception)
        }
        parent = parent.parent
      }
    }

    // get new axis to recurse down, if any, eg 'relay' -> 'agents'
    const getNextLevel = {
      relay: 'agents',
      agents: 'devices',
      devices: 'dataitems',
      dataitems: null,
    }
    const nextLevel = getNextLevel[level] // eg 'agents'

    if (nextLevel) {
      // get child config items - eg agents, devices, dataitems
      const childConfigs = config[nextLevel] // eg config['agents'] = [{alias:'Main',...},...]
      const childParent = config
      // recurse down child configs, if any
      for (let childConfig of childConfigs || []) {
        // this.getPlans(plans, childConfig, nextLevel, childParent) // recurse down the tree
        this.addPlans(childConfig, nextLevel, childParent) // recurse down the tree
      }
    }

    // // now build sql statements
    // const clauses = config.autoprune.clauses
    //   .map(clause => `(${clause})`)
    //   .join(' and ')
    // const sql = `
    //   DELETE FROM raw.history
    //   WHERE ?
    //   AND timestamp < now() - ?::interval
    // `
    // const sqlValues = [clauses, plan.retention]
    // setup.autoprune.sql = sql
    // setup.autoprune.sqlValues = sqlValues
  }

  // recurse down setup tree, adding sql delete queries to each level
  addSql(setup) {
    const clauses = setup.clauses.map(clause => `(${clause})`).join(' and ')
    const sql = `
      DELETE FROM raw.history 
      WHERE ?
      AND timestamp < now() - ?::interval
    `
    const sqlValues = [clauses, plan.retention]
    setup.autoprune.sql = sql
    setup.autoprune.sqlValues = sqlValues
    // this.addSql(setup)
  }

  // get a where clause for 'select node_id from dataitems where ...' query
  getWhereClause(config, level, parent) {
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

  // // add exception to parent filters
  // addException(plans, parent, exception) {
  //   if (parent) {
  //     console.log('parent', parent)
  //     parent.clauses.push(exception)
  //     this.addException(plans, parent.parent, exception) // recurse up the tree
  //   }
  // }

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
  //. wouldnt you want this to recurse down a tree? i guess it has a list, but
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
