// autoprune removes old historical data on a retention schedule.
// one autoprune instance per agent.

import schedule from 'node-schedule' // https://github.com/node-schedule/node-schedule

// sheduled autoprune day/time
//. could specify this in setup.yaml if needed to.
// this format is from node-schedule's scheduleJob fn.
// note: for testing, can comment these out so will run every minute.
// important: docker defaults to utc, so must specify timezone!
// note: second defaults to 0, so will run at top of minute.
const when = {
  // hour: 0, // must specify 0, as unspecified/null means every hour
  // minute: 0, // must specify 0, as unspecified/null means every minute
  // dayOfWeek: 0, // 0=sunday
  minute: 30,
  // this will get overridden by setup.client.timezone value
  tz: 'America/Chicago', // https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
}

// next levels for recursing through setup.yaml
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
    this.job = null
    this.when = { ...when, tz: this.setup.client?.timezone } // use setup.yaml timezone if specified
  }

  // start the autoprune timer
  async start() {
    console.log(`Autoprune start job scheduler for`, this.when)
    // Object Literal Syntax
    // To make things a little easier, an object literal syntax is also supported,
    // like in this example which will log a message every Sunday at 2:30pm:
    //   const job = schedule.scheduleJob({hour: 14, minute: 30, dayOfWeek: 0}, foo)
    this.job = schedule.scheduleJob(this.when, this.prune.bind(this))
    console.log(
      `Autoprune scheduled for`,
      this.job.nextInvocation().toISOString()
    )
  }

  // prune old data from db based on retention schedules in setup.yaml.
  // note: setup.relay doesn't have to be there - hence setup?.relay.
  async prune(callTime) {
    console.log(`Autoprune pruning old data at`, callTime.toISOString())
    await this.pruneLevel(this.setup.relay, 'relay') // recurse setup, starting at relay setting
    // console.dir(this.setup.relay, { depth: null })
    await this.vacuumAnalyze() // free old data
  }

  // prune dataitem history for a setup.yaml level.
  // config is like { id|alias, retention, [nextLevel] }.
  // level is the current config level, eg 'devices'.
  // parent is the parent config/setup object.
  // [nextLevel] is the next level to recurse to, eg dataitems.
  async pruneLevel(config, level, parent = null) {
    // console.log('Autoprune level', level, config.alias || config.id || 'top')

    const retention = config.retention // eg '1wk' or undefined

    // if this level specifies a retention, add an autoprune object to the setup tree
    if (retention) {
      // get where clause differently depending on setup level.
      // we make this an array so can add override clauses from lower levels.
      const clause = this.getWhereClause(config, level, parent) // eg `path like 'Main/Micro'` etc
      const clauses = [clause]

      // add autoprune object to this level
      config.autoprune = { level, clauses, retention, parent }

      // add clause negation as an exception to all parent filters, recursing upwards.
      // this way, parent prunes don't step on our toes.
      const exception = 'not ' + clause
      while (parent) {
        if (parent.autoprune?.clauses) {
          parent.autoprune.clauses.push(exception)
        }
        parent = parent.parent // go up a level
      }
    }

    // get new child property to recurse down.
    // the tree is a little weird because each level has a different child property.
    const nextLevel = getNextLevel[level] // eg 'relay' -> 'agents'

    // recurse down to next level, if any
    if (nextLevel) {
      // get child config items, if any - eg agents, devices, dataitems
      const childConfigs = config[nextLevel] || []
      const childParent = config
      // recurse down child configs - eg agent of agents
      for (let childConfig of childConfigs) {
        // console.log('Autoprune recurse', childConfig.alias || childConfig.id)
        await this.pruneLevel(childConfig, nextLevel, childParent) // recurse down the tree
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
      const dataitemIds = await this.getDataItemIds(dataitemFilter)
      // console.log(`Autoprune dataitemIds for ${level}`, dataitemIds)

      // delete old data using node_ids
      if (dataitemIds.length > 0) {
        // const where = `node_id in (${dataitemIds.join(',')})`
        const where = `dataitem_id in (${dataitemIds.join(',')})`
        const sql = `delete from raw.history where ${where} and time < now() - '${interval}'::interval`
        console.log(`Autoprune delete:`, sql)
        await this.db.query(sql)
      } else {
        console.log(`Autoprune no node_ids for`, dataitemFilter)
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
    console.log(`Autoprune error getWhereClause unknown level ${level}`)
  }

  // get node_ids for a given dataitem filter, eg `(1=1) and (path like 'Main/Micro/%')`.
  // important: this is technically a list of dataitem_ids, not device node_ids!
  // because the nodes table stores both devices and dataitems,
  // while raw.history has node_id (the device) and dataitem_id (the full path).
  async getDataItemIds(dataitemFilter) {
    const sql = `select node_id from dataitems where ${dataitemFilter}`
    console.log('Autoprune query:', sql)
    const result = await this.db.query(sql) // can be null
    // bug: javascript sort does alphabetical, NOT numeric sort, even if convert array to numbers!
    // so must use a compare function.
    const nodeIds =
      result?.rows?.map(row => Number(row.node_id)).sort((a, b) => a - b) || []
    // console.log(nodeIds)
    return nodeIds
  }

  // run vacuum analyze on all tables - to reclaim deleted rows disk space
  async vacuumAnalyze() {
    console.log(`Autoprune vacuum analyze...`)
    const sql = `vacuum analyze`
    const result = await this.db.query(sql) // eg { command: 'VACUUM', rowCount: 0 } or null
    console.log(`Autoprune vacuum analyze done`)
  }
}
