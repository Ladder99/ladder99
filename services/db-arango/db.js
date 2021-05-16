require('dotenv').config()

const { Database } = require('arangojs')

const db = new Database({ url: process.env.DB_HOST })
db.createDatabase(process.env.DB_NAME) // will just use it if already created?
db.database(process.env.DB_NAME)
// db.useBasicAuth(process.env.DB_USERNAME, process.env.DB_PASSWORD)

module.exports = db
