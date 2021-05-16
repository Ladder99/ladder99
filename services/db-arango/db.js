require('dotenv').config()
const { Database } = require('arangojs')

const db = new Database({ url: process.env.DB_HOST })
// console.log(db)

db.database(process.env.DB_NAME)
// console.log(db)

// db.useBasicAuth(process.env.DB_USERNAME, process.env.DB_PASSWORD)

// export default db
module.exports = db
