// database class
// wraps postgres/timescaledb/timegraph db

import fs from 'fs' // node lib
import pg from 'pg' // postgres driver https://github.com/brianc/node-postgres
const { Pool } = pg // note: import { Client } from 'pg' gives error, so must do this
import pgFormat from 'pg-format' // see https://github.com/datalanche/node-pg-format
import * as lib from './lib.js'

export class Db {
  constructor() {
    this.client = null
  }

  async start() {
    await this.connect()
    this.init()
    await this.migrate()
  }

  async connect() {
    let client = null
    const pool = new Pool()
    do {
      try {
        const params = {
          host: process.env.PGHOST,
          port: process.env.PGPORT,
          database: process.env.PGDATABASE,
        }
        console.log(`Trying to connect to db...`, params)
        client = await pool.connect() // uses envars PGHOST, PGPORT etc
      } catch (error) {
        console.log(`Error ${error.code} - will sleep before retrying...`)
        console.log(error)
        await lib.sleep(4000)
      }
    } while (!client)
    this.client = client
  }

  init() {
    const that = this

    //. need init:true in compose yaml to get SIGINT etc? tried - nowork
    process
      .on('SIGTERM', getShutdown('SIGTERM'))
      .on('SIGINT', getShutdown('SIGINT'))
      .on('uncaughtException', getShutdown('uncaughtException'))

    // get shutdown handler
    function getShutdown(signal) {
      return error => {
        console.log()
        console.log(`Signal ${signal} received - shutting down...`)
        if (error) console.error(error.stack || error)
        that.disconnect()
        process.exit(error ? 1 : 0)
      }
    }
  }

  disconnect() {
    if (!this.client) {
      console.log(`Releasing db client...`)
      this.client.release()
    }
  }

  //. handle versions - use meta table
  //. move src/migrations elsewhere eventually
  async migrate() {
    console.log(`Migrating database structures...`)
    await this.readFile(`src/migrations/001-extensions.sql`)
    await this.readFile(`src/migrations/002-base-tables.sql`)
    await this.readFile(`src/migrations/003-base-views.sql`)
    await this.readFile(`src/migrations/004-base-functions.sql`)
    await this.readFile(`src/migrations/005-get_timeline.sql`)
    await this.readFile(`src/migrations/006-get_jobs.sql`)
    await this.readFile(`src/migrations/007-get_rate.sql`)
    await this.readFile(`src/migrations/008-get_availability.sql`)
    await this.readFile(`src/migrations/009-metrics.sql`)
  }

  async readFile(filename) {
    console.log(`Loading ${filename}...`)
    return await this.client.query(String(fs.readFileSync(filename)))
  }

  async query(sql, options) {
    //. add try catch block - ignore error? or just print it?
    return await this.client.query(sql, options)
  }

  // add a node to nodes table - if already there, return node_id of existing record.
  // uses node.path to determine uniqueness and look up record.
  // assumes nodes table has a unique index on that json prop.
  async add(node) {
    try {
      const values = `'${JSON.stringify(node)}'`
      const sql = `INSERT INTO nodes (props) VALUES (${values}) RETURNING node_id;`
      console.log(sql)
      const res = await this.query(sql)
      // @ts-ignore
      const { node_id } = res.rows[0]
      return node_id
    } catch (error) {
      // eg error: duplicate key value violates unique constraint "nodes_path"
      // detail: "Key ((props ->> 'path'::text))=(Device(e05363af-95d1-4354-b749-8fbb09d3499e)) already exists.",
      // console.log(error)
      if (error.code === '23505') {
        console.log(`property already there - looking up:  ${node.path}`)
        const sql = `SELECT node_id FROM nodes WHERE props->>'path' = $1::text;`
        console.log(sql, node.path)
        const res = await this.query(sql, [node.path])
        // @ts-ignore
        const { node_id } = res.rows[0]
        console.log('got', node_id)
        return node_id
      } else {
        console.log(error)
      }
    }
  }

  async addHistory(records) {
    // if just one record, turn it into an array
    if (!Array.isArray(records)) {
      records = [records]
    }
    if (records.length < 1) return // do nothing
    // write array of records
    // see https://stackoverflow.com/a/63167970/243392 - uses pgformat library
    try {
      // const sql = `INSERT INTO history (node_id, dataitem_id, time, value)
      // VALUES ($1, $2, $3, $4::jsonb);`
      const values = records.map(record => [
        record.node_id,
        // record.property_id,
        record.dataitem_id,
        record.time,
        record.value,
      ])
      const sql = pgFormat(
        // `INSERT INTO history (node_id, property_id, time, value) VALUES %L;`,
        `INSERT INTO history (node_id, dataitem_id, time, value) VALUES %L;`,
        values
      )
      console.log(sql.slice(0, 100))
      const res = await this.query(sql)
      return res
    } catch (e) {
      // eg error: duplicate key value violates unique constraint "nodes_path"
      // detail: "Key ((props ->> 'path'::text))=(Device(e05363af-95d1-4354-b749-8fbb09d3499e)) already exists.",
      console.log(e)
    }
  }

  // get latest value of a device's property path
  async getLatestValue(table, device, path) {
    const sql = `
    select value
    from ${table}
    where device='${device.name}' and path='${path}'
    order by time desc
    limit 1;
    `
    console.log(sql)
    const result = await this.query(sql)
    // console.log(result)
    const value = result.rowCount > 0 && result.rows[0]['value']
    return value
  }

  // //. read nodes and edges into graph structure
  // async getGraph(Graph) {
  //   const graph = new Graph()
  //   const sql = `SELECT * FROM nodes;`
  //   const res = await this.client.query(sql)
  //   const nodes = res.rows // [{ _id, props }]
  //   console.log(nodes)
  //   for (const node of nodes) {
  //     graph.addNode(node)
  //   }
  //   //. get edges also
  //   return graph
  // }
}
