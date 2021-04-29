// import Influx from 'influx'
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

// import { Sequelize } from 'sequelize'

// const sequelize = new Sequelize(connect, {
//   dialect: 'postgres',
//   protocol: 'postgres',
//   dialectOptions: {},
// })
// console.log(sequelize)

// sequelize
//   .authenticate()
//   .then(() => {
//     console.log('Connection has been established successfully.')
//   })
//   .catch(err => {
//     console.error('Unable to connect to the database:', err)
//   })

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
