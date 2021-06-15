// tapedeck
// play/record MQTT messages
// inspired by rpdswtk/mqtt_recorder, a python app
// currently pass params by envars, except mode=play/record pass on cmdline

import fs from 'fs'
import mqttlib from 'mqtt'
import parse from 'csv-parse/lib/sync.js'

const host = process.env.HOST || 'localhost'
const mode = process.env.MODE || 'play'
const port = Number(process.env.PORT || 1883)
const loop = Boolean(process.env.LOOP || false)
const topics = process.env.TOPICS || '#'
const folder = '/etc/tapedeck' // must match that in compose.yaml

console.log(`Tapedeck`)
console.log(`Play/record MQTT messages`)
console.log(`------------------------------------------------------------`)
console.log(mode)

const clientId = `tapedeck-${Math.random()}`
const config = { host, port, clientId }

console.log(`Connecting to MQTT broker on`, config)
const mqtt = mqttlib.connect(config)

mqtt.on('connect', async function onConnect() {
  console.log(`Connected...`)

  const columns = 'topic,payload,qos,retain,time_now,time_delta'.split(',')

  if (mode === 'play') {
    console.log(`Playback mode`)
    console.log(`Reading list of files in ${folder}...`)
    // const simulationsFolder = `${modelsFolder}/${model}/simulations` //.
    const csvfiles = fs
      .readdirSync(folder)
      .filter(csvfile => csvfile.endsWith('.csv'))
      .sort()

    // do while loop
    do {
      console.log(`Looping over files...`)
      for (const csvfile of csvfiles) {
        const csvpath = `${folder}/${csvfile}`
        console.log(`Reading ${csvpath}...`)
        const csv = await fs.readFileSync(csvpath)
        const rows = parse(csv, { columns })
        for (const row of rows) {
          const { payload, qos, retain, time_delta } = row
          // const topic = row.topic.replace('${deviceId}', deviceId) //. handle this
          const topic = row.topic
          console.log(`Publishing topic ${topic}: ${payload.slice(0, 40)}...`)
          // mqtt.publish(topic, payload)
          mqtt.publish(topic, payload, { qos, retain })
          await sleep(time_delta * 1000) // pause between messages
        }
        await sleep(1000) // pause between csv files
      }
      await sleep(1000) // pause between loops
    } while (loop)
  } else {
    console.log(`Record mode`)
    console.log(`Subscribing to MQTT topics (${topics})...`)
    mqtt.subscribe(topics, null, callback)
    const filename =
      // @ts-ignore
      new Date().toISOString().replaceAll(':', '').slice(0, 17) + '.csv'
    const filepath = `${folder}/${filename}`
    console.log(`Recording MQTT messages to ${filename}...`)
    const fd = fs.openSync(filepath, 'a')
    const buffer = 'hello\n'
    fs.writeSync(fd, buffer)
    fs.writeSync(fd, buffer)
    fs.closeSync(fd)
    // function(err, granted){} where: {Error} err - subscription error
    // (none at the moment!) { Array } granted - array of { topic: 't', qos: 0 }
    function callback(err, granted) {
      console.log(granted)
    }
  }

  console.log(`Closing MQTT connection...`)
  mqtt.end()
})

// sleep ms milliseconds
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
