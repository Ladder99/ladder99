// create and use db
// see https://www.arangodb.com/tutorials/tutorial-node-js/

require('dotenv').config()
const { Database } = require('arangojs')

async function getDb() {
  // connect to running arrangodb server
  const system = new Database({ url: process.env.DB_HOST })

  // create db if not there
  const dbs = await system.listDatabases()
  if (!dbs.includes(process.env.DB_NAME)) {
    await system.createDatabase(process.env.DB_NAME)
  }

  // use db
  const db = system.database(process.env.DB_NAME)

  // authorize
  // db.useBasicAuth(process.env.DB_USERNAME, process.env.DB_PASSWORD)

  return db
}

module.exports = getDb
