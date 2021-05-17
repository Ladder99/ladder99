const getDb = require('../db')

module.exports.up = async function () {
  const db = await getDb()
  const collection = await db.createCollection('persons')
}

module.exports.down = async function () {
  const db = await getDb()
  const collection = await db.collection('persons')
  await collection.drop()
}
