// mqtt-json player/recorder

import fs from 'fs' // node lib for filesystem
import mqttlib from 'mqtt' // see https://github.com/mqttjs/MQTT.js
import parse from 'csv-parse/lib/sync.js' // see https://github.com/adaltas/node-csv-parse
import * as lib from '../common/lib.js'

export class RecorderPlugin {
  start({ deviceId, mode, host, port, folder, csvfiles, loop, topic }) {
    console.log(`Starting mqtt-json plugin, mode ${mode}...`)

    let fd // file descriptor for recording

    process
      .on('SIGTERM', getShutdown('SIGTERM'))
      .on('SIGINT', getShutdown('SIGINT'))
      .on('uncaughtException', getShutdown('uncaughtException'))

    // get shutdown handler
    function getShutdown(signal) {
      return err => {
        // console.log()
        console.log(`Signal ${signal} received - shutting down...`)
        if (err) console.error(err.stack || err)
        if (fd) fs.closeSync(fd)
        console.log(`Closing MQTT connection...`)
        mqtt.end()
        process.exit(err ? 1 : 0)
      }
    }

    const clientId = `recorder-${Math.random()}`
    const config = { host, port, clientId }

    console.log(`Connecting to MQTT broker on`, config)
    const mqtt = mqttlib.connect(config)

    mqtt.on('connect', async function onConnect() {
      console.log(`Connected...`)
      if (mode === 'play') {
        await play()
      } else {
        await record()
      }
      console.log(`Closing MQTT connection...`)
      mqtt.end()
    })

    mqtt.on('disconnect', () => handleEvent('disconnect'))
    mqtt.on('offline', () => handleEvent('offline'))
    mqtt.on('reconnect', () => handleEvent('reconnect'))
    mqtt.on('close', () => handleEvent('close'))
    mqtt.on('error', error => handleEvent('error', error))

    function handleEvent(msg, error) {
      console.log(msg)
      if (error) console.log('error', error)
    }

    //------------------------------------------------------------------------
    // play
    //------------------------------------------------------------------------

    async function play() {
      // do while loop
      do {
        console.log(`Looping over files...`)
        for (const csvfile of csvfiles) {
          const csvpath = `${folder}/${csvfile}`

          console.log(`Reading and publishing ${csvpath}...`)
          let csv = await fs.readFileSync(csvpath).toString()

          // replace all ${deviceId} occurrences with deviceId
          // @ts-ignore
          // csv = csv.replaceAll('${deviceId}', deviceId) // needs node15
          const regexp = new RegExp('\\${deviceId}', 'g')
          csv = csv.replace(regexp, deviceId)

          const rows = parse(csv, { columns: true, skip_empty_lines: true })

          for (const row of rows) {
            const { topic, message, qos, retain, time_delta } = row
            console.log(`Publishing topic ${topic}: ${message.slice(0, 40)}`)
            //. mosquitto closes with "disconnected due to protocol error" when send qos
            // mqtt.publish(topic, payload, { qos, retain })
            mqtt.publish(topic, message, { retain })
            await lib.sleep(time_delta * 1000) // pause between messages
          }
          console.log()
          await lib.sleep(1000) // pause between csv files
        }
        await lib.sleep(1000) // pause between loops
      } while (loop)
    }

    //------------------------------------------------------------------------
    // record
    //------------------------------------------------------------------------

    async function record() {
      console.log(`Subscribing to MQTT topics (${topic})...`)
      mqtt.subscribe(topic, null, onSubscribe)

      // subscribed - granted is array of { topic, qos }
      function onSubscribe(err, granted) {
        console.log('Subscribed to', granted, '...')

        // open file for writing
        const datetime = new Date()
          .toISOString()
          // @ts-ignore
          .replaceAll(':', '')
          .slice(0, 17)
        const filename = datetime + '.csv'
        const filepath = `${folder}/${filename}`
        console.log(`Recording MQTT messages to '${filepath}'...`)
        try {
          fd = fs.openSync(filepath, 'w')
        } catch (error) {
          console.log(
            `Problem opening file - does the folder '${folder}' exist?`
          )
          process.exit(1)
        }
        let time_last = Number(new Date()) / 1000 // seconds

        const row = `topic,message,qos,retain,time_now,time_delta\n`
        fs.writeSync(fd, row)

        mqtt.on('message', onMessage)
        console.log(`Listening...`)

        // message received - add to file
        function onMessage(topic, message, packet) {
          message = message.toString()
          console.log('Message received:', topic, message.slice(0, 60))
          // message = message.replaceAll('"', '""') // make ready to write as json string // needs node15
          message = message.replace(new RegExp('"', 'g'), '""') // make ready to write as json string
          const { qos, retain } = packet
          const time_now = Number(new Date()) / 1000 // seconds
          const time_delta = time_now - time_last // seconds
          time_last = time_now
          topic = topic.replace(deviceId, '${deviceId}') //. ok? dubious
          // write each message
          //. or write to array and flush every n msgs
          const row = `${topic},"${message}",${qos},${retain},${time_now},${time_delta}\n`
          fs.writeSync(fd, row)
        }
      }

      do {
        await lib.sleep(2000)
      } while (true)
    }
  }
}
