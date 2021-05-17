const getDb = require('../getDb')

module.exports.up = async function () {
  const db = await getDb()
}

module.exports.down = async function () {
  const db = await getDb()
}
