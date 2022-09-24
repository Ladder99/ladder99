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
    schedule.scheduleJob(this.when, this.prune.bind(this)) // eg call prune once a week
    this.prune() //... direct test
  }

  // prune old data from db based on retention schedules in setup.yaml.
  // note: setup.relay doesn't have to be there - hence setup?.relay.
  async prune() {
    console.log(`Autoprune - pruning old data...`)

    this.pruneLevel(this.setup.relay, 'relay') // recurse setup, starting at relay setting

    console.log(`Autoprune - setup.relay`)
    console.dir(this.setup.relay, { depth: null })

    await this.vacuumAnalyze()

    process.exit(0) //.
  }

  // get tree/list of plan objects recursively,
  // like { retention:'1wk', clauses:['1=1',...], parent: null}.
  // plans is the growing list of plan objects.
  // config is like { id|alias, retention, [nextLevel] },
  // level is the current config level, eg 'dataitems',
  // parent is the parent config/setup object.
  async pruneLevel(config, level, parent = null) {
    console.log('Autoprune pruneLevel', level)

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
        if (parent.autoprune?.clauses) {
          parent.autoprune.clauses.push(exception)
        }
        parent = parent.parent
      }
    }

    // get new axis to recurse down, if any, eg 'relay' -> 'agents'.
    // this tree is hard to navigate because each level has different child attribute.
    const getNextLevel = {
      relay: 'agents',
      agents: 'devices',
      devices: 'dataitems',
      dataitems: null,
    }
    const nextLevel = getNextLevel[level] // eg 'agents'

    if (nextLevel) {
      // get child config items - eg agents, devices, dataitems
      const childConfigs = config[nextLevel]
      const childParent = config
      // recurse down child configs, if any - eg agent of agents
      for (let childConfig of childConfigs || []) {
        this.pruneLevel(childConfig, nextLevel, childParent) // recurse down the tree
      }
    }

    // now build and run sql statements
    if (config.autoprune) {
      const sql = `delete from raw.history where ? and timestamp<now()-?::interval;`
      const where = config.autoprune.clauses
        ?.map(clause => `(${clause})`)
        .join(' and ')
      const interval = config.autoprune.retention
      const values = [where, interval]
      // config.autoprune.sql = sql
      // config.autoprune.values = values
      //. make sure values are safe, esp interval - if 0 would delete all data!
      console.log({ sql, values })
      if (interval) {
        await this.db.query(sql, values)
      }
    }
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
      return `props->>'id' = '${config.id}'` // match dataitem id, eg 'm-avail'
    }
  }

  // run vacuum analyze on all tables - to reclaim deleted rows disk space
  async vacuumAnalyze() {
    console.log(`Autoprune - vacuum analyze...`)
    const sql = `vacuum analyze`
    await this.db.query(sql)
  }
}
