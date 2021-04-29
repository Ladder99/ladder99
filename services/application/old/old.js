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
