const getDb = require('../getDb')

module.exports.up = async function () {
  const db = await getDb()
  const nodes = await db.createCollection('nodes')
  const edges = await db.createEdgeCollection('edges')
}

module.exports.down = async function () {
  const db = await getDb()
  const nodes = await db.collection('nodes')
  await nodes.drop()
  const edges = await db.collection('edges')
  await edges.drop()
}
