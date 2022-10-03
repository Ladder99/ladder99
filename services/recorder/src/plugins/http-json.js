// http-json plugin

// experimental plugin - exposes values from csv files to an http port.
// it's up to the device driver to read the data via http GET.

import fs from 'fs' // node lib for filesystem
import http from 'http' // node lib
import parse from 'csv-parse/lib/sync.js' // see https://github.com/adaltas/node-csv-parse
import * as lib from '../common/lib.js'

export class RecorderPlugin {
  async start({ deviceId, mode, host, port, loop, folder, csvfiles }) {
    console.log(`Starting http-json plugin, mode ${mode}...`)

    console.log(`Create http server, listen on port ${port}...`)
    const server = http.createServer(requestListener)
    server.listen(port)

    // contains data to make available on http
    const cache = {}

    // publish data on GET request
    function requestListener(req, res) {
      res.writeHead(200)
      res.end(JSON.stringify(cache))
    }

    if (mode === 'play') {
      await play()
    } else {
      //. record
    }

    async function play() {
      // do while loop
      do {
        console.log(`Looping over files...`)
        for (const csvfile of csvfiles) {
          const csvpath = `${folder}/${csvfile}`
          console.log(`Reading and publishing ${csvpath}...`)
          let csv = await fs.readFileSync(csvpath).toString()
          // @ts-ignore
          // csv = csv.replaceAll('${deviceId}', deviceId) // replaceAll needs node15
          const regexp = new RegExp('\\${deviceId}', 'g')
          csv = csv.replace(regexp, deviceId)
          const rows = parse(csv, { columns: true, skip_empty_lines: true })
          for (const row of rows) {
            const { topic, message, qos, retain, time_delta } = row
            // console.log(`Publishing topic ${topic}: ${message.slice(0, 40)}`)
            const payload = JSON.parse(message)
            for (let key of Object.keys(payload)) {
              cache[key] = payload[key]
            }
            await lib.sleep(time_delta * 1000) // pause between messages
          }
          console.log()
          await lib.sleep(1000) // pause between csv files
        }
        await lib.sleep(1000) // pause between loops
      } while (loop)
    }
  }
}
