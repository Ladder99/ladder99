import fetch from 'node-fetch'
// import { Sequelize } from 'sequelize'

console.log(`MTConnect Application starting`)

// const username = 'postgres'
// const password = 'gralgrut'
// const host = 'timescaledb'
// const port = '5432'
// const database = 'tutorial'
// const connect = `postgres://${username}:${password}@${host}:${port}/${database}`

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

const url = process.env.URL || 'http://agent:5000/sample'
const interval = Number(process.env.INTERVAL || 2000) // msec

async function shovel() {
  try {
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
  } catch (error) {
    if (error.code === 'ENOTFOUND') {
      console.log(`Agent not found at ${url} - waiting...`)
    } else {
      throw error
    }
  }
}

setInterval(shovel, interval)
