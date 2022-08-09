import fs from 'fs' // node lib

const versions = {
  1: [
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
  2: ['012-bins-hypertable'],
}

// handle versions - use meta table
export async function migrate(db) {
  console.log(`Migrating database structures...`)
  let currentVersion = (await db.getMetaValue('schema-version')) || 0
  const oldVersion = currentVersion
  for (let version of Object.keys(versions)) {
    if (currentVersions === version) {
      const filenames = versions[version]
      for (let filename of filenames) {
        const path = `src/migrations/${filename}.sql`
        await readFile(db, path)
      }
      currentVersion += 1
    }
  }
  if (currentVersion !== oldVersion) {
    await db.setMetaValue('schema-version', currentVersion)
  }
  console.log(`Done migrating.`)
}

async function readFile(db, filename) {
  console.log(`Loading ${filename}...`)
  return await db.query(String(fs.readFileSync(filename)))
}
