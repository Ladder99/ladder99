// const getDb = require('../db')

require('dotenv').config()
const { Database } = require('arangojs')

module.exports.up = async function () {
  // const db = await getDb()
  const system = new Database({ url: process.env.DB_HOST })
  await system.createDatabase(process.env.DB_NAME)
  const db = system.database(process.env.DB_NAME)
  const collection = await db.createCollection('persons')
}

module.exports.down = async function () {
  // const db = await getDb()
  const collection = await db.collection('persons')
  await collection.drop()
}
