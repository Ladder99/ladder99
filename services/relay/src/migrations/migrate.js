import fs from 'fs' // node lib

// a migration has key=current version, and a list of files to execute.
// the current version will be incremented by 1 after the migration is done.
const migrations = {
  0: [
    '001-extensions',
    '002-base-tables',
    '003-base-views',
    '004-base-functions',
    '005-get_timeline',
    '006-get_jobs',
    '007-get_rate',
    '008-get_availability',
    '009-metrics',
    '010-get_count',
    '011-get_last_value',
  ],
  1: ['012-bins-hypertable'],
  2: ['020-utiliz-factors'],
  3: ['030-setup', '031-postgrest'],
}

// handle migrations - use meta table
export async function migrate(db) {
  console.log(`Migrating database structures...`)
  let currentVersion = (await db.getMetaValue('schema-version')) || 0
  console.log(`Current version`, currentVersion)
  const oldVersion = currentVersion
  for (let migrationVersion of Object.keys(migrations)) {
    // note == instead of ===, in case of string value
    if (currentVersion == migrationVersion) {
      const filenames = migrations[migrationVersion]
      for (let filename of filenames) {
        const path = `src/migrations/${filename}.sql`
        await readFile(db, path)
      }
      currentVersion += 1
    }
  }
  if (currentVersion !== oldVersion) {
    console.log(`Update version to`, currentVersion)
    await db.setMetaValue('schema-version', currentVersion)
  }
  console.log(`Done migrating.`)
}

async function readFile(db, filename) {
  console.log(`Loading ${filename}...`)
  return await db.query(String(fs.readFileSync(filename)))
}
