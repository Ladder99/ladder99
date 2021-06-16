// tape
// plays/records MQTT messages
// inspired by rpdswtk/mqtt_recorder, a python app

import fs from 'fs'
import mqttlib from 'mqtt' // see https://github.com/mqttjs/MQTT.js
import parse from 'csv-parse/lib/sync.js' // see https://github.com/adaltas/node-csv-parse
// @ts-ignore
import { Command } from 'commander/esm.mjs' // see https://github.com/tj/commander.js

// parse command line arguments
const program = new Command()
program
  .option('-h, --host <host>', 'mqtt host', 'localhost')
  .option('-p, --port <port>', 'mqtt port', 1883)
  .option('-m, --mode <mode>', 'play or record', 'play')
  .option('-l, --loop <loop>', 'play in a loop', true)
  .option('-t, --topic <topic>', 'topic to subscribe to', '#')
  .option('-f, --folder <folder>', 'folder containing csv files', 'tapedeck')
program.parse(process.argv)
const options = program.opts()
const { host, port, mode, loop, topic, folder } = options

console.log()
console.log(`Tape`)
console.log(`Plays/records MQTT messages`)
console.log(`------------------------------------------------------------`)

const modeString = mode === 'play' ? 'Playback' : 'Record'
console.log(`${modeString} mode`)

const clientId = `tape-${Math.random()}`
// const config = { host, port, clientId, reconnectPeriod: 0 }
const config = { host, port, clientId }

console.log(`Connecting to MQTT broker on`, config)
const mqtt = mqttlib.connect(config)

let fd // file descriptor for recording

process
  .on('SIGTERM', getShutdown('SIGTERM'))
  .on('SIGINT', getShutdown('SIGINT'))
  .on('uncaughtException', getShutdown('uncaughtException'))

mqtt.on('disconnect', () => exit('disconnect'))
mqtt.on('offline', () => exit('offline'))
mqtt.on('reconnect', () => exit('reconnect'))
mqtt.on('close', () => exit('close'))
mqtt.on('error', e => exit('error', e))

function exit(msg, e) {
  console.log(msg, e)
  process.exit(1)
}

mqtt.on('connect', async function onConnect() {
  console.log(`Connected...`)

  const columns = 'topic,payload,qos,retain,time_now,time_delta'.split(',')

  if (mode === 'play') {
    console.log(`Reading list of files in folder '${folder}'...`)
    let csvfiles
    try {
      csvfiles = fs
        .readdirSync(folder)
        .filter(csvfile => csvfile.endsWith('.csv'))
        .sort()
    } catch (error) {
      console.log(`Problem reading files - does the folder '${folder}' exist?`)
      process.exit(1)
    }
    if (csvfiles.length === 0) {
      console.log(`No csv files found in folder '${folder}'.`)
      process.exit(1)
    }

    // do while loop
    do {
      console.log(`Looping over files...`)
      for (const csvfile of csvfiles) {
        const csvpath = `${folder}/${csvfile}`

        process.stdout.write(`Reading ${csvpath}`)
        const csv = await fs.readFileSync(csvpath)
        const rows = parse(csv, { columns })

        for (const row of rows) {
          process.stdout.write('.')
          const { payload, qos, retain, time_delta } = row
          // const topic = row.topic
          const topic = row.topic.replace('${deviceId}', 'ccs-pa-001') //... handle this
          // console.log(`Publishing topic ${topic}: ${payload.slice(0, 40)}...`)
          //. mosquitto closes with "disconnected due to protocol error" when send qos
          // mqtt.publish(topic, payload, { qos, retain })
          mqtt.publish(topic, payload, { retain })
          await sleep(time_delta * 1000) // pause between messages
        }
        console.log()
        await sleep(1000) // pause between csv files
      }
      await sleep(1000) // pause between loops
    } while (loop)
  } else {
    console.log(`Subscribing to MQTT topics (${topic})...`)
    mqtt.subscribe(topic, null, onSubscribe)

    // subscribed - granted is array of { topic, qos }
    function onSubscribe(err, granted) {
      console.log('Subscribed to', granted, '...')

      // open file for writing
      // @ts-ignore
      const datetime = new Date().toISOString().replaceAll(':', '').slice(0, 17)
      const filename = datetime + '.csv'
      const filepath = `${folder}/${filename}`
      console.log(`Recording MQTT messages to '${filepath}'...`)
      try {
        fd = fs.openSync(filepath, 'w')
      } catch (error) {
        console.log(`Problem opening file - does the folder '${folder}' exist?`)
        process.exit(1)
      }
      let time_last = Number(new Date()) / 1000 // seconds

      mqtt.on('message', onMessage)
      console.log(`Listening...`)

      // message received - add to file
      function onMessage(topic, buffer, packet) {
        const message = buffer.toString()
        console.log('Message received:', topic, message.slice(0, 60))
        const msg = message.replaceAll('"', '""')
        const { qos, retain } = packet
        const time_now = Number(new Date()) / 1000 // seconds
        const time_delta = time_now - time_last // seconds
        time_last = time_now
        const row = `${topic},"${msg}",${qos},${retain},${time_now},${time_delta}\n`
        //. write each msg, or write to array and flush every n msgs
        fs.writeSync(fd, row)
      }
    }

    do {
      await sleep(2000)
    } while (true)
  }

  console.log(`Closing MQTT connection...`)
  mqtt.end()
})

// sleep ms milliseconds
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// get shutdown handler
function getShutdown(signal) {
  return err => {
    console.log()
    console.log(`Signal ${signal} received - shutting down...`)
    if (err) console.error(err.stack || err)
    if (fd) fs.closeSync(fd)
    console.log(`Closing MQTT connection...`)
    mqtt.end()
    process.exit(err ? 1 : 0)
  }
}
