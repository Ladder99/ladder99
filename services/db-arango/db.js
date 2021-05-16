// see https://www.arangodb.com/tutorials/tutorial-node-js/

require('dotenv').config()

const { Database } = require('arangojs')

// connect to running arrangodb server
// const db = new Database() // defaults to localhost:8529
// const db = new Database(process.env.DB_HOST) // can pass string
const db = new Database({ url: process.env.DB_HOST })

// create a database
await db.createDatabase(process.env.DB_NAME) // okay if already created

// use it
db.database(process.env.DB_NAME) // replaces useDatabase - works immediately

// db.database(process.env.DB_NAME)
// db.useBasicAuth(process.env.DB_USERNAME, process.env.DB_PASSWORD)

module.exports = db
