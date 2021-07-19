// test plugin

// import fs from 'fs' // node lib for filesystem
import http from 'http' // node lib
import * as common from '../common.js'

function requestListener(req, res) {
  res.writeHead(200)
  res.end('Hello, World!')
}

export class Plugin {
  constructor() {}

  async init({ mode, host, port }) {
    console.log(`init test, mode ${mode}`)

    const server = http.createServer(requestListener)
    server.listen(8080)

    if (mode === 'play') {
      await play()
    } else {
    }
    async function play() {
      // do while loop
      // do {
      // console.log(`Looping over files...`)
      // for (const csvfile of csvfiles) {
      //   const csvpath = `${folder}/${csvfile}`
      // console.log(`Reading and publishing ${csvpath}...`)
      // let csv = await fs.readFileSync(csvpath).toString()
      // // @ts-ignore
      // csv = csv.replaceAll('${deviceId}', deviceId)
      // const rows = parse(csv, { columns: true, skip_empty_lines: true })
      // const rows = [{}]
      // for (const row of rows) {
      //   const { topic, message, qos, retain, time_delta } = row
      //   // console.log(`Publishing topic ${topic}: ${message.slice(0, 40)}`)
      //   //. mosquitto closes with "disconnected due to protocol error" when send qos
      //   // mqtt.publish(topic, payload, { qos, retain })
      //   // mqtt.publish(topic, message, { retain })
      //   await common.sleep(time_delta * 1000) // pause between messages
      // }
      // console.log()
      // await common.sleep(1000) // pause between csv files
      // }
      //   await common.sleep(1000) // pause between loops
      // } while (loop)
    }
  }
}
