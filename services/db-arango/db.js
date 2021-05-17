// see https://www.arangodb.com/tutorials/tutorial-node-js/

require('dotenv').config()

const { Database } = require('arangojs')

async function getDb() {
  // connect to running arrangodb server
  // const db = new Database() // defaults to localhost:8529
  // const db = new Database(process.env.DB_HOST) // can pass string
  const db = new Database({ url: process.env.DB_HOST })

  try {
    db.database(process.env.DB_NAME) // replaces useDatabase - works immediately
  } catch (error) {
    console.log(error.message)
    await db.createDatabase(process.env.DB_NAME)
    db.database(process.env.DB_NAME) // replaces useDatabase - works immediately
  }

  // authorize
  // db.useBasicAuth(process.env.DB_USERNAME, process.env.DB_PASSWORD)

  return db
}

module.exports = getDb
