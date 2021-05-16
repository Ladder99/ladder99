require('dotenv').config()
const arangojs = require('arangojs')

const db = new arangojs.Database({ url: process.env.DB_HOST })

db.useDatabase(process.env.DB_NAME)
db.useBasicAuth(process.env.DB_USERNAME, process.env.DB_PASSWORD)
