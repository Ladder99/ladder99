// database class
// wraps postgres/timescaledb/timegraph db

import fs from 'fs' // node lib
import pg from 'pg' // postgres driver https://github.com/brianc/node-postgres
const { Pool } = pg // note: import { Client } from 'pg' gives error, so must do this
import * as libapp from './libapp.js'

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
        await libapp.sleep(4000)
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
    const path = `src/migrations/001-init.sql`
    const sql = String(fs.readFileSync(path))
    console.log(`Migrating database structures...`)
    await this.client.query(sql)
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
      const { node_id } = res.rows[0]
      return node_id
    } catch (e) {
      console.log(e)
      const sql = `SELECT node_id FROM nodes WHERE props->>'path' = $1::text;`
      console.log(sql)
      const res = await this.query(sql, [node.path])
      console.log(res)
      const { node_id } = res.rows[0]
      return node_id
    }
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
