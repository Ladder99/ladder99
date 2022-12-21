import fs from 'fs' // node lib

//. clean these up

// a migration has key=current version, and a list of files to execute.
// the current version will be incremented by 1 after the migration is done.
const migrations = {
  idempotent: ['001-extensions', '004-base-functions'],
  versions: {
    0: [
      '002-base-tables',
      '003-base-views',
      '005-get_timeline',
      '006-get_jobs',
      '007-get_rate',
      '009-metrics',
      '010-get_count',
      '011-get_last_value',
    ],
    1: ['012-bins-hypertable'],
    2: ['020-update'],
    3: ['021-update-views', '022-get_timeline2', '023-get_last_value2'],
    // 4: ['024-update-bins-metrics'],
  },
}

// handle migrations - use meta table
export async function migrate(db) {
  console.log(`Migrate database structures...`)

  // run idempotent sql
  console.log(`Migrate run idempotent sql...`)
  for (let migration of migrations.idempotent) {
    const path = `src/migrations/idempotent/${migration}.sql`
    await readFile(db, path)
  }

  // run versioned sql
  console.log(`Migrate run versioned sql...`)
  let currentVersion = (await db.getMetaValue('schema-version')) || 0
  console.log(`Migrate current version`, currentVersion)
  const oldVersion = currentVersion
  for (let migrationVersion of Object.keys(migrations.versions)) {
    // note == instead of ===, in case of string value
    if (currentVersion == migrationVersion) {
      const filenames = migrations.versions[migrationVersion]
      for (let filename of filenames) {
        const path = `src/migrations/versions/${filename}.sql`
        await readFile(db, path)
      }
      currentVersion += 1
    }
  }
  if (currentVersion !== oldVersion) {
    console.log(`Migrate update version to`, currentVersion)
    await db.setMetaValue('schema-version', currentVersion)
  }
  console.log(`Migrate done.`)
}

async function readFile(db, filename) {
  console.log(`Migrate loading ${filename}...`)
  return await db.query(String(fs.readFileSync(filename))) // can be null
}
