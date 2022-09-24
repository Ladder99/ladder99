// autoprune removes old historical data on a retention schedule.
// one autoprune instance per agent.

import schedule from 'node-schedule'

const getNextLevel = {
  relay: 'agents',
  agents: 'devices',
  devices: 'dataitems',
  dataitems: null,
}

export class Autoprune {
  //
  constructor(params, db, setup) {
    this.params = params
    this.db = db
    this.setup = setup
    this.when = { hour: 0, minute: 0, dayOfWeek: 0 } // sunday 0:00 - ie saturday midnight
  }

  // start the autoprune timer
  async start() {
    // console.log(`Autoprune start job scheduler for`, this.when)
    //. schedule.scheduleJob(this.when, this.prune.bind(this)) // eg call prune once a week
    await this.prune() //... direct test
  }

  // prune old data from db based on retention schedules in setup.yaml.
  // note: setup.relay doesn't have to be there - hence setup?.relay.
  async prune() {
    console.log(`Autoprune pruning old data...`)

    await this.pruneLevel(this.setup.relay, 'relay') // recurse setup, starting at relay setting

    console.log(`Autoprune setup.relay`)
    console.dir(this.setup.relay, { depth: null })

    await this.vacuumAnalyze()
  }

  // prune dataitem history for a setup.yaml level.
  // config is like { id|alias, retention, [nextLevel] }.
  // level is the current config level, eg 'devices'.
  // parent is the parent config/setup object.
  async pruneLevel(config, level, parent = null) {
    console.log('Autoprune pruneLevel', level, config.alias || config.id)

    const retention = config.retention // eg '1wk' or undefined

    // if this level specifies a retention, add an autoprune object to the setup tree
    if (retention) {
      // get where clause differently depending on setup level
      const clause = this.getWhereClause(config, level, parent) // eg `path like 'Main/Micro'` etc
      const clauses = [clause]

      // start autoprune object for this level
      config.autoprune = { level, clauses, retention, parent }

      // add negation as an exception to all parent filters, recursing upwards
      const exception = 'not ' + clause //. will this work?
      while (parent) {
        if (parent.autoprune?.clauses) {
          parent.autoprune.clauses.push(exception)
        }
        parent = parent.parent
      }
    }

    // get new axis to recurse down, if any, eg 'relay' -> 'agents'.
    // this tree is weird to navigate because each level has different child attribute.
    const nextLevel = getNextLevel[level] // eg 'relay' -> 'agents'

    // recurse down to next level, if any
    if (nextLevel) {
      // get child config items - eg agents, devices, dataitems
      const childConfigs = config[nextLevel]
      const childParent = config
      // recurse down child configs, if any - eg agent of agents
      for (let childConfig of childConfigs || []) {
        console.log('Autoprune recurse', childConfig.alias || childConfig.id)
        this.pruneLevel(childConfig, nextLevel, childParent) // recurse down the tree
      }
    }

    // after recursion, now can build and run sql statements
    if (config.autoprune) {
      //
      // make sure interval is safe - eg '0' would delete ALL DATA!
      const interval = config.autoprune.retention // eg '1wk'
      if (!(interval > '0' && interval <= '9')) {
        console.log(`Autoprune invalid interval ${interval}`)
        return
      }

      // get list of node_ids for this level
      const dataitemFilter = config.autoprune.clauses
        ?.map(clause => `(${clause})`)
        .join(' and ')
      const nodeIds = await this.getNodeIds(dataitemFilter)
      console.log(`Autoprune nodeIds for ${level} ${config.alias}`, nodeIds)

      // validate with select query
      if (true) {
        const where = `${dataitemFilter} and time < now() - ${interval}::interval`
        const validateSql = `select * from raw.history where ${where}`
        const result = await this.db.query(validateSql)
        console.log(`Autoprune validate`, result)
      }

      // delete old data using node_ids
      if (nodeIds.length > 0) {
        const sql = `delete from raw.history where ? and time < now() - ?::interval`
        const where = `node_id in (${nodeIds.join(',')})`
        const values = [where, interval]
        console.log('Autoprune run query with', { sql, values })
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
    console.log(`Autoprune getWhereClause unknown level ${level}`)
  }

  // get node_ids for a given dataitem filter, eg `(1=1) and (path like 'Main/Micro/%')`
  async getNodeIds(dataitemFilter) {
    const sql = `select node_id from dataitems where $1`
    const values = [dataitemFilter]
    console.log('Autoprune getNodeIds', { sql, values })
    const result = await this.db.query(sql, values)
    const nodeIds = result.rows?.map(row => row.node_id)
    return nodeIds
  }

  // run vacuum analyze on all tables - to reclaim deleted rows disk space
  async vacuumAnalyze() {
    console.log(`Autoprune vacuum analyze...`)
    const sql = `vacuum analyze`
    await this.db.query(sql)
  }
}
