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
  4: ['040-get_rate_pps'],
  5: ['050-add-device-department'],
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
        await runFile(db, path)
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

async function runFile(db, filename) {
  console.log(`Migrate loading ${filename}...`)
  // read sql file
  let str = String(fs.readFileSync(filename))
  // replace ${...} references with envar value, eg '${PGAUTHPASSWORD}' with value
  const refs = str.match(/\$\{(\w+)\}/g) // find all ${...} references
  if (refs) {
    for (let ref of refs) {
      console.log(`Migrate replace ${ref} with envar value`) // eg '${PGAUTHPASSWORD}'
      const key = ref.replace('${', '').replace('}', '') // eg 'PGAUTHPASSWORD'
      const value = process.env[key] ?? '' // eg a password
      if (value === '') {
        console.log(`Migrate warning: envar ${key} not found`)
      }
      str = str.replace(ref, value)
    }
  }
  // run the sql query
  return await db.query(str) // can be null
}
