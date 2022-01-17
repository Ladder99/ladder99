import fs from 'fs' // node lib

//. handle versions - use meta table
//. move src/migrations elsewhere eventually
//. move this code into migrations/migrate.js, call from relay
export async function migrate(db) {
  console.log(`Migrating database structures...`)
  await readFile(db, `./001-extensions.sql`)
  await readFile(db, `./002-base-tables.sql`)
  await readFile(db, `./003-base-views.sql`)
  await readFile(db, `./004-base-functions.sql`)
  await readFile(db, `./005-get_timeline.sql`)
  await readFile(db, `./006-get_jobs.sql`)
  await readFile(db, `./007-get_rate.sql`)
  await readFile(db, `./008-get_availability.sql`)
  await readFile(db, `./009-metrics.sql`)
}

async function readFile(db, filename) {
  console.log(`Loading ${filename}...`)
  return await db.query(String(fs.readFileSync(filename)))
}
