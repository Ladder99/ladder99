// database class
// wraps arangodb

// import fs from 'fs' // node lib - filesystem
import { Database } from 'arangojs' // https://github.com/arangodb/arangojs
import * as lib from './lib.js'

// arangodb
const arangoHost = process.env.ARANGO_HOST || 'localhost'
const arangoPort = process.env.ARANGO_PORT || '8529'
const arangoUrl = `http://${arangoHost}:${arangoPort}`
const arangoDatabase = process.env.ARANGO_DATABASE || 'ladder99'
const arangoUser = process.env.ARANGO_USER || 'root'
const arangoRootPassword = process.env.ARANGO_ROOT_PASSWORD || ''

export class Db {
  constructor() {
    this.system = null
    this.db = null
    this.nodes = null
    this.edges = null
    this.handleSignals()
  }

  async start() {
    await this.connect()
    await this.migrate()
  }

  async connect() {
    let system = null
    do {
      try {
        console.log(`Trying to connect to db...`, arangoUrl)
        system = new Database(arangoUrl)
        system.useBasicAuth(arangoUser, arangoRootPassword)
      } catch (error) {
        console.log(`Error ${error.code} - will sleep before retrying...`)
        console.log(error)
        await lib.sleep(4000)
      }
    } while (!system)
    this.system = system
  }

  //. handle versions - use meta collection
  async migrate() {
    await this.createDb()
    await this.createCollections()
    // console.log(`Migrating database structures...`)
    // const path = `migrations/001-init.sql`
    // const sql = String(fs.readFileSync(path))
  }

  // create/get our db
  async createDb() {
    console.log(`db...`)
    const dbs = await this.system.listDatabases()
    if (!dbs.includes(arangoDatabase)) {
      console.log(`Creating database ${arangoDatabase}...`)
      await this.system.createDatabase(arangoDatabase)
    }
    // db.useDatabase(arangoDatabase) //. ? see https://www.arangodb.com/tutorials/tutorial-node-js/
    this.db = this.system.database(arangoDatabase)
  }

  // create/get collections
  async createCollections() {
    console.log(`coll...`)
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

  async query(aql) {
    const cursor = await this.db.query(aql)
    return cursor
  }

  disconnect() {
    console.log(`Releasing db...`)
    // if (this.db) {
    //   this.db //.
    // }
    // if (this.system) {
    //   this.system //.
    // }
  }

  handleSignals() {
    const that = this
    //. need init:true in compose yaml to get SIGINT etc? tried - nowork
    process
      .on('SIGTERM', getHandler('SIGTERM'))
      .on('SIGINT', getHandler('SIGINT'))
      .on('uncaughtException', getHandler('uncaughtException'))
    // get shutdown handler
    function getHandler(signal) {
      return error => {
        console.log()
        console.log(`Signal ${signal} received - shutting down...`)
        if (error) console.error(error.stack || error)
        that.disconnect()
        process.exit(error ? 1 : 0)
      }
    }
  }
}
