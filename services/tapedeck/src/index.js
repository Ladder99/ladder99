// tapedeck
// records/replays MQTT recordings
// inspired by rpdswtk/mqtt_recorder, a python app

import fs from 'fs'
import mqttlib from 'mqtt'
import parse from 'csv-parse/lib/sync.js'

const host = process.env.MQTT_HOST || 'localhost'
const port = Number(process.env.MQTT_PORT || 1883)
const deviceId = process.env.DEVICE_ID // eg 'ccs-pa-001'
const model = process.env.MODEL // eg 'ccs-pa'
const modelsFolder = process.env.MODELS_FOLDER || '/etc/models'
const loop = Boolean(process.env.LOOP || false)
const loopDelay = Number(process.env.LOOP_DELAY || 3000)

console.log(`Tapedeck`)
console.log(`Record/playback of MQTT messages`)
console.log(`------------------------------------------------------------`)

const clientId = deviceId
const config = { host, port, clientId }
console.log(`Connecting to MQTT broker on`, config)
const mqtt = mqttlib.connect(config)

mqtt.on('connect', async function onConnect() {
  const simulationsFolder = `${modelsFolder}/${model}/simulations`
  const csvfiles = fs
    .readdirSync(simulationsFolder)
    .filter(csvfile => csvfile.endsWith('.csv'))
    .sort((a, b) => a.localeCompare(b))
  const columns = 'topic,payload,qos,retain,time_now,time_delta'.split(',')

  console.log(`Connected - publishing messages...`)

  // do while loop
  do {
    for (const csvfile of csvfiles) {
      const csvpath = `${simulationsFolder}/${csvfile}`
      console.log(`Reading ${csvpath}...`)
      const csv = fs.readFileSync(csvpath)
      const rows = parse(csv, { columns })
      for (const row of rows) {
        const { payload, qos, time_delta } = row
        const topic = row.topic.replace('${deviceId}', deviceId)
        console.log(`Publishing topic ${topic}: ${payload.slice(0, 40)}...`)
        mqtt.publish(topic, payload)
        await new Promise(resolve => setTimeout(resolve, time_delta * 1000))
      }
      await new Promise(resolve => setTimeout(resolve, loopDelay))
    }
  } while (loop)

  console.log(`Closing MQTT connection...`)
  mqtt.end()
})
