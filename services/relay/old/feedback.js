// provide feedback to devices

// currently used for watching changes to jobboss job number,
// sending a part count reset to a marumatsu cutter via mqtt.
// this will all be replaced by MTConnect Interfaces eventually.

import libmqtt from 'mqtt' // see https://www.npmjs.com/package/mqtt

// optional flag defined in .env
// lets you turn off the feedback mechanism from oxbox 004,
// but leave it on for 001. otherwise they might interfere with each other.
const feedbackOff = process.env.RELAY_FEEDBACK_OFF

// a Feedback instance monitors dataitems for changes and
// sends feedback to devices.
export class Feedback {
  //
  constructor(setup) {
    this.setup = setup
    this.timer = null
    this.mqtt = null
  }

  // find relevant devices, connect to them, save connections
  start() {
    console.log('Feedback - start')
    console.log(`Feedback - RELAY_FEEDBACK_OFF value =`, feedbackOff)

    if (feedbackOff) return

    const that = this

    for (let device of this.setup.devices || []) {
      for (let source of device.sources || []) {
        if (source.feedback) {
          // connect to mqtt broker/server
          //. hardcoded as mqtt for now
          const url = `mqtt://${source.host}:${source.port}` //. will use source.connection.host etc
          console.log(`Feedback - connecting to mqtt broker on ${url}...`)
          const mqtt = libmqtt.connect(url)

          // handle connection
          mqtt.on('connect', function onConnect() {
            console.log(`Feedback - connected to mqtt broker`)
            //. save to source.feedback object instead?
            source.mqtt = mqtt // save connection to source object
          })
        }
      }
    }
  }

  // save current values so can check for changes in the check method
  set(current) {
    if (feedbackOff) return
    console.log(`Feedback - check current data...`)
    const observations = current.observations || []
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
            // console.log(`Feedback - looking for changes in ${feedback.monitor}`)
            for (let observation of observations) {
              if (observation.dataItemId === feedback.monitor) {
                console.log(
                  `Feedback - setting saved value to ${observation.value}...`
                )
                // save observation value (eg jobnum) to source object
                source.lastValue = observation.value
              }
            }
          }
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

  // note: this is called by agentReader.js whenever new observations come in.
  async check(sample) {
    if (feedbackOff) return
    // console.log(`Feedback - check sample data...`)
    const observations = sample.observations || []
    // find relevant devices
    for (let device of this.setup.devices || []) {
      // find relevant sources
      for (let source of device.sources || []) {
        const feedback = source.feedback
        if (feedback) {
          // make sure we have a connection available
          //. hardcode as mqtt for now
          if (source.mqtt) {
            // check for changed observation (feedback.monitor is a dataitemId)
            // console.log(`Feedback - looking for changes in ${feedback.monitor}`)
            for (let observation of observations) {
              if (observation.dataItemId === feedback.monitor) {
                if (
                  source.lastValue !== undefined &&
                  observation.value !== source.lastValue
                ) {
                  console.log(
                    `Feedback - ${observation.dataItemId} changed from ${source.lastValue} to ${observation.value}`
                  )
                  // publish list of messages
                  for (let message of feedback.messages) {
                    const payloadStr = JSON.stringify(message.payload)
                    console.log(
                      `Feedback - publishing to ${message.topic}: ${payloadStr}...`
                    )
                    // publish mqtt message
                    source.mqtt.publish(message.topic, payloadStr)
                    // wait a bit
                    console.log(`Feedback - wait 5 sec`)
                    await new Promise(resolve => setTimeout(resolve, 5000))
                  }

                  // save observation value (eg jobnum)
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
