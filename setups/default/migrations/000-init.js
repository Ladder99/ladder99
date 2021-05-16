import { Database, aql } from 'arangojs'

const dbname = 'ladder99-default' // default is the setup folder name

const db = new Database({
  url: 'http://localhost:8529',
})

// create database
// db._createDatabase('ladder99-default', {}, [{ username: "newUser", passwd: "123456", active: true}])
// db._createDatabase(dbname)
await db.createDatabase(dbname)

// use it
// db._useDatabase(dbname)
db.useDatabase(dbname)

// add user

// create collections
db.createCollection('nodes')
db.createEdgeCollection('edges')
