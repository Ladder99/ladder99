// postgres class
// wraps postgres/timescaledb/timegraph db

// important: keep in synch with meter and relay services -
// ie copy/paste any changes to each.

// note: needs PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD
// environment variables set for connection

import pg from 'pg' // postgres driver https://github.com/brianc/node-postgres
const { Pool } = pg // note: import { Pool } from 'pg' gives error, so must do this

export class Postgres {
  constructor() {
    this.client = null
  }

  async start() {
    await this.connect()
    this.init()
  }

  async connect() {
    let client = null
    const pool = new Pool()
    do {
      try {
        console.log(`Trying to connect to db...`, {
          host: process.env.PGHOST,
          port: process.env.PGPORT,
          database: process.env.PGDATABASE,
        })
        client = await pool.connect() // uses envars PGHOST, PGPORT etc
      } catch (error) {
        console.log(`Error ${error.code} - will sleep before retrying...`)
        console.log(error)
        // await lib.sleep(4000)
        await new Promise(resolve => setTimeout(resolve, 4000))
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

  // execute a query and return results
  async query(sql, options) {
    //. add try catch block - ignore error? or just print it?
    return await this.client.query(sql, options)
  }
}
