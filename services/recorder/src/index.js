// recorder
// plays/records device messages

import fs from 'fs' // node lib for filesys
// @ts-ignore
import { Command } from 'commander/esm.mjs' // see https://github.com/tj/commander.js
import * as lib from './common/lib.js'

// parse command line arguments
const program = new Command()
program.option('-m, --mode <mode>', 'play or record', 'play')
program.parse(process.argv)
const options = program.opts()
const { mode = 'play' } = options

// file system inputs
const pluginsFolder = './plugins'
// defined in compose.yaml with docker volume mappings
const setupFolder = process.env.L99_SETUP_FOLDER || '/data/setup'
const schemasFolder = process.env.L99_SCHEMAS_FOLDER || '/data/schemas' // incls print-apply/recordings, etc

console.log()
console.log(`Recorder`)
console.log(`Plays/records device messages`)
console.log(`------------------------------------------------------------`)

async function main() {
  const setup = lib.readSetup(setupFolder)
  // iterate over devices in setup.yaml
  const { devices } = setup
  for (let device of devices) {
    const deviceId = device.id
    // iterate over sources for each device
    const { sources } = device
    for (let source of sources) {
      // get source, with defaults //. change defaults?
      const {
        module,
        driver = 'mqtt-json',
        host = 'localhost',
        port = 1883,
        loop = true,
        topic = '#',
        recorderDriver,
      } = source

      // get plugin class for the source driver
      try {
        const pluginPath = `${pluginsFolder}/${recorderDriver || driver}.js`
        console.log(`Importing plugin from ${pluginPath}...`)
        //. add try/catch with nicer message
        const { RecorderPlugin } = await import(pluginPath)

        // get list of recorded csv files for the source module.
        // do this here instead of in each plugin
        const folder = `${schemasFolder}/${module}/recordings`
        let csvfiles = []
        if (mode === 'play') {
          console.log(`Reading list of files in folder '${folder}'...`)
          try {
            csvfiles = fs
              .readdirSync(folder)
              .filter(csvfile => csvfile.endsWith('.csv'))
              .sort()
          } catch (error) {
            console.log(
              `Problem reading files - does folder '${folder}' exist?`
            )
            process.exit(1)
          }
          if (csvfiles.length === 0) {
            console.log(`No csv files found in folder '${folder}'.`)
            process.exit(1)
          }
        }

        // instantiate a plugin for the source driver
        const plugin = new RecorderPlugin()
        //. should we just pass the whole source to the plugin?
        plugin.init({
          deviceId,
          mode,
          host,
          port,
          folder,
          csvfiles,
          loop,
          topic,
        })
      } catch (error) {
        console.log('error', error.message)
      }
    }
  }
}

main()
