// recorder
// plays/records device messages

import * as common from './common.js'
// @ts-ignore
import { Command } from 'commander/esm.mjs' // see https://github.com/tj/commander.js

// parse command line arguments
const program = new Command()
program.option('-m, --mode <mode>', 'play or record', 'play')
// .option('-f, --folder <folder>', 'folder containing csv files', 'recordings')
// .option('-l, --loop <loop>', 'play in a loop', true)
// .option('-h, --host <host>', 'mqtt host', 'localhost')
// .option('-p, --port <port>', 'mqtt port', 1883)
// .option('-t, --topic <topic>', 'topic to subscribe to', '#')
program.parse(process.argv)
const options = program.opts()
const { host, port, mode, loop, topic, folder } = options

// file system inputs
const pluginsFolder = './plugins'
// these folders are defined in pipeline.yaml with docker volume mappings
const setupFolder = '/data/setup' // incls setup.yaml etc
const modelsFolder = '/data/models' // incls ccs/print-apply, etc

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
    // iterate over sources for each device
    const { sources } = device
    for (let source of sources) {
      // instantiate a plugin for the source protocol (mqtt, test)
      const { model, protocol, host, port, loop, topic } = source
      const pluginPath = `${pluginsFolder}/${protocol}.js`
      console.log(`Importing plugin from ${pluginPath}...`)
      const { Plugin } = await import(pluginPath)
      const plugin = new Plugin()
      // initialize the plugin
      const folder = `${modelsFolder}/${model}/recordings`
      plugin.init({ mode, host, port, folder, loop, topic })
    }
  }
}

main()

// process
//   .on('SIGTERM', getShutdown('SIGTERM'))
//   .on('SIGINT', getShutdown('SIGINT'))
//   .on('uncaughtException', getShutdown('uncaughtException'))

// mqtt.on('disconnect', () => handleEvent('disconnect'))
// mqtt.on('offline', () => handleEvent('offline'))
// mqtt.on('reconnect', () => handleEvent('reconnect'))
// mqtt.on('close', () => handleEvent('close'))
// mqtt.on('error', error => handleEvent('error', error))

// function handleEvent(msg, error) {
//   console.log(msg)
//   if (error) console.log(error)
// }

// // get shutdown handler
// function getShutdown(signal) {
//   return err => {
//     console.log()
//     console.log(`Signal ${signal} received - shutting down...`)
//     if (err) console.error(err.stack || err)
//     if (fd) fs.closeSync(fd)
//     console.log(`Closing MQTT connection...`)
//     mqtt.end()
//     process.exit(err ? 1 : 0)
//   }
// }
