'use strict'

const db = require('../db')

module.exports.up = async function () {
  console.log('hi')
  const collection = await db.createCollection('persons')
}

module.exports.down = async function () {
  console.log('bye')
  const collection = await db.collection('persons')
  await collection.drop()
}
