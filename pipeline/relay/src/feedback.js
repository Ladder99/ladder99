// provide feedback to devices

//. this will all be replaced by MTConnect Interfaces

import libmqtt from 'mqtt' // see https://www.npmjs.com/package/mqtt

// a Feedback instance monitors dataitems for changes and
// sends feedback to devices.
export class Feedback {
  constructor(setup) {
    this.setup = setup
    this.timer = null
    this.mqtt = null
  }

  // find relevant devices, connect to them, save connections
  start() {
    console.log('Feedback - start')

    const that = this

    for (let device of this.setup.devices || []) {
      for (let source of device.sources || []) {
        if (source.feedback) {
          // connect to mqtt broker/server
          //. hardcode as mqtt for now
          const url = `mqtt://${source.host}:${source.port}` //. source.connection.host etc
          console.log(`Feedback - connecting to mqtt broker on ${url}...`)
          const mqtt = libmqtt.connect(url)

          // handle connection
          mqtt.on('connect', function onConnect() {
            console.log(`Feedback - connected to mqtt broker`)
            source.mqtt = mqtt // save connection
          })
        }
      }
    }
  }

  // check relevant dataitems for changes, send feedback to device.
  // observations is [{ tag, dataItemId, name, timestamp, value }, ...]
  // eg [{
  //   tag: 'Availability',
  //   dataItemId: 'm1-avail',
  //   name: 'availability',
  //   sequence: '30',
  //   timestamp: '2021-09-14T17:53:21.414Z',
  //   value: 'AVAILABLE'
  // }, ...]
  // data is a Data object from dataObservations.js
  // called by agentReader.js
  async check(data) {
    console.log(`Feedback - check observations...`)
    const observations = data.observations || []
    // find relevant devices
    for (let device of this.setup.devices || []) {
      // find relevant sources
      for (let source of device.sources || []) {
        const feedback = source.feedback
        if (feedback) {
          // make sure we have a connection available
          //. hardcode as mqtt for now
          if (source.mqtt) {
            // check for changed observation
            console.log(`Feedback - looking for changes in ${feedback.monitor}`)
            for (let observation of observations) {
              if (observation.dataItemId === feedback.monitor) {
                if (
                  source.lastValue &&
                  observation.value !== source.lastValue
                ) {
                  console.log(
                    `Feedback - ${observation.dataItemId} changed from ${source.lastValue} to ${observation.value}...`
                  )
                  console.log(
                    `Feedback - publishing to ${feedback.topic}: ${feedback.payload}...`
                  )
                  //... turn this on once all looks okay
                  // source.mqtt.publish(feedback.topic, feedback.payload)
                  source.lastValue = observation.value
                }
              }
            }
          }
        }
      }
    }
  }
}
