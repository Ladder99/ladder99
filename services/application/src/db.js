// database class
// wraps arangodb

// import fs from 'fs' // node lib - filesystem
import { Database } from 'arangojs' // https://github.com/arangodb/arangojs
import * as libapp from './libapp.js'

// arangodb
const arangoHost = process.env.ARANGO_HOST || 'http://localhost'
const arangoPort = process.env.ARANGO_PORT || '8529'
const arangoUrl = `${arangoHost}:${arangoPort}`
const arangoDatabase = process.env.ARANGO_DATABASE || 'ladder99'

export class Db {
  constructor() {
    this.system = null
    this.db = null
    this.nodes = null
    this.edges = null
  }

  async start() {
    this.setSignals()
    await this.connect()
    await this.migrate()
  }

  setSignals() {
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

  async connect() {
    let system = null
    do {
      try {
        console.log(`Trying to connect to db...`, arangoUrl)
        system = new Database(arangoUrl)
      } catch (error) {
        console.log(`Error ${error.code} - will sleep before retrying...`)
        console.log(error)
        await libapp.sleep(4000)
      }
    } while (!system)
    this.system = system
  }

  disconnect() {
    console.log(`Releasing db...`)
    // if (!this.system) {
    //   this.system //.
    // }
    if (!this.db) {
      this.db //.
    }
  }

  //. handle versions - use meta table
  async migrate() {
    console.log(`Migrating database structures...`)
    await this.createDb()
    await this.createCollections()
    // const path = `migrations/001-init.sql`
    // const sql = String(fs.readFileSync(path))
  }

  // create our db if not there
  async createDb() {
    const dbs = await this.system.listDatabases()
    console.log(dbs)
    if (!dbs.includes(arangoDatabase)) {
      console.log(`Creating database ${arangoDatabase}...`)
      await this.system.createDatabase(arangoDatabase)
    }
    // db.useDatabase(arangoDatabase) //. ? see https://www.arangodb.com/tutorials/tutorial-node-js/
    this.db = this.system.database(arangoDatabase)
  }

  // create collections if not there
  async createCollections() {
    const collections = await this.db.listCollections()
    if (!collections.find(collection => collection.name === 'nodes')) {
      console.log(`Creating nodes collection...`)
      await this.db.createCollection('nodes')
    }
    this.nodes = this.db.collection('nodes')
    if (!collections.find(collection => collection.name === 'edges')) {
      console.log(`Creating edges collection...`)
      await this.db.createEdgeCollection('edges')
    }
    this.edges = this.db.collection('edges')
  }

  // async query(sql) {
  //   return await this.client.query(sql)
  // }
}
