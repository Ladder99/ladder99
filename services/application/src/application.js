import fetch from 'node-fetch'
// import Influx from 'influx'

import { Sequelize } from 'sequelize'

const connect = 'postgres://bburns:gralgrut@timescaledb:5432/timescaledb'
const sequelize = new Sequelize(connect, {
  dialect: 'postgres',
  protocol: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
})
console.log(sequelize)

const url = process.env.URL || 'http://agent:5000/sample'
const interval = Number(process.env.INTERVAL || 2000) // msec

// const influx = new Influx.InfluxDB({
//   host: 'influxdb',
//   database: 'ocean_tides',
//   schema: [
//     {
//       measurement: 'tide',
//       fields: { height: Influx.FieldType.FLOAT },
//       tags: ['unit', 'location'],
//     },
//   ],
// })

async function shovel() {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  })
  const json = await response.json()
  console.log(json)
  // console.dir(json, { depth: null })
  // const streams = json.MTConnectStreams.Streams
  // for (const stream of streams) {
  //   const device = stream.DeviceStream
  //   console.log(device)
  //   const components = device.ComponentStreams
  //   for (const component of components) {
  //     console.log(component)
  //     const events = component.ComponentStream.Events
  //     for (const event of events) {
  //       console.log(event)
  //     }
  //   }
  // }
}

setInterval(shovel, interval)
