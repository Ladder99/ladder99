// recorder
// plays/records device messages

// @ts-ignore
import { Command } from 'commander/esm.mjs' // see https://github.com/tj/commander.js
import * as common from './common.js'

// parse command line arguments
const program = new Command()
program.option('-m, --mode <mode>', 'play or record', 'play')
program.parse(process.argv)
const options = program.opts()
const { mode = 'play' } = options

// file system inputs
const pluginsFolder = './plugins'
// these folders are defined in pipeline.yaml with docker volume mappings
const setupFolder = '/data/setup' // incls setup.yaml etc
const modelsFolder = '/data/models' // incls ccs/print-apply/recordings, etc

console.log()
console.log(`Recorder`)
console.log(`Plays/records device messages`)
console.log(`------------------------------------------------------------`)

const setupFile = `${setupFolder}/setup.yaml`
console.log(`Reading ${setupFile}...`)
const setup = common.importYaml(setupFile)
if (!setup) {
  console.log(`No ${setupFile} available - please add one.`)
  process.exit(1)
}

async function main() {
  // iterate over devices in setup.yaml
  const { devices } = setup
  for (let device of devices) {
    const { id: deviceId } = device
    // iterate over sources for each device
    const { sources } = device
    for (let source of sources) {
      // instantiate a plugin for the source protocol
      const {
        model,
        protocol = 'mqtt-json',
        host = 'localhost',
        port = 1883,
        loop = true,
        topic = '#',
      } = source
      const pluginPath = `${pluginsFolder}/${protocol}.js`
      console.log(`Importing plugin from ${pluginPath}...`)
      const { Plugin } = await import(pluginPath)
      // initialize the plugin
      const folder = `${modelsFolder}/${model}/recordings`
      const plugin = new Plugin()
      plugin.init({ deviceId, mode, host, port, folder, loop, topic })
    }
  }
}

main()
