// mqtt-json driver
// subscribes to mqtt topics, receives messages,
// parses them out as JSON, updates cache values, which sends SHDR to agent.

import libmqtt from 'mqtt' // see https://www.npmjs.com/package/mqtt
import { v4 as uuid } from 'uuid' // see https://github.com/uuidjs/uuid - may be used by inputs/outputs yaml js

let cycleStart
let keyvalues = {} // keyvalue store for yaml code to use

export class AdapterDriver {
  // initialize the client plugin
  // queries the device for address space definitions, subscribes to topics.
  // inputs is the inputs.yaml file parsed to a js tree.
  // note: types IS used - by the part(cache, $) fn evaluation
  init({ deviceId, deviceName, host, port, cache, inputs, types }) {
    console.log('init', { deviceId })
    const url = `mqtt://${host}:${port}`

    // connect to mqtt broker/server
    console.log(`MQTT connecting to broker on ${url}...`)
    const mqtt = libmqtt.connect(url)

    // handle connection
    mqtt.on('connect', function onConnect() {
      console.log(`MQTT connected to broker on ${url}`)

      // register message handler
      console.log(`MQTT registering message handler`)
      mqtt.on('message', onMessage)

      // subscribe to any topics defined
      for (const entry of inputs.connect.subscribe) {
        const topic = replaceDeviceId(entry.topic)
        console.log(`MQTT subscribing to ${topic}`)
        mqtt.subscribe(topic)
      }

      // publish to any topics defined
      for (const entry of inputs.connect.publish) {
        const topic = replaceDeviceId(entry.topic)
        console.log(`MQTT publishing to ${topic}`)
        mqtt.publish(topic, entry.message)
      }

      console.log(`MQTT listening for messages...`)
    })

    // handle incoming messages.
    // eg for ccs-pa have query, status, and read messages.
    // msgTopic - mqtt topic, eg 'l99/pa1/evt/query'
    // message - array of bytes (assumed to be a json string)
    function onMessage(msgTopic, message) {
      message = message.toString()
      console.log(`Got message on topic ${msgTopic}: ${message.slice(0, 20)}`)

      const receivedTime = new Date()

      // unpack the mqtt json payload, assuming it's a JSON string.
      // sets payload as variable - used by handler.initialize
      const payload = JSON.parse(message)

      // iterate over message handlers - handlers is an array of [topic, handler]
      const handlers = Object.entries(inputs.handlers) || []
      let msgHandled = false
      handlers.forEach(([topic, handler]) => {
        topic = replaceDeviceId(topic)

        // eg msgTopic => 'l99/pa1/evt/query'
        if (topic === msgTopic) {
          // unsubscribe from topics as needed
          for (const entry of handler.unsubscribe || []) {
            const topic = replaceDeviceId(entry.topic)
            console.log(`MQTT unsubscribe from ${topic}`)
            mqtt.unsubscribe(topic)
          }

          // run initialize handler
          // eg can assign payload values to a dictionary $ here for fast lookups.
          // eg initialize: 'payload.forEach(item => $[item.keys[0]] = item)'
          console.log(`MQTT initialize handler`)
          let $ = {} // a variable representing payload data
          eval(handler.initialize)
          // console.log($)

          // define lookup function
          // eg lookup: '($, part) => ({ value: ($[part] || {}).default })'
          console.log(`MQTT define lookup function`)
          const lookup = eval(handler.lookup)

          // iterate over inputs - an array of [key, part], eg ['fault_count', '%M55.2'].
          // if part is in payload, add it to the cache.
          console.log(`MQTT iterate over inputs`)
          const inputs = Object.entries(handler.inputs) || []
          for (const [key, part] of inputs) {
            const cacheId = deviceId + '-' + key // eg 'pa1-fault_count'
            // if part is an object, assume it's { code, value },
            // where code is some js code string,
            // and value is a function that needs to be evaluated like value(cache, $).
            if (typeof part === 'object') {
              const { code, value: valueFn } = part
              console.log(`key,code`, key, code)
              const value = valueFn(cache, $) // may use `types` dict also
              console.log(`Got ${value} - set ${cacheId}...`)
              cache.set(cacheId, { value }) // save value to cache - may send shdr to tcp
            } else {
              // use the lookup function to get item from payload, if there
              const item = lookup($, part)
              console.log('part,item', part, item)
              // if we have the part in the payload, add it to the cache
              if (item && item.value !== undefined) {
                console.log(`MQTT part '${part}' in payload - set ${cacheId}`)
                // item.receivedTime = receivedTime
                cache.set(cacheId, item) // save to the cache - may send shdr to tcp
              }
            }
          }

          console.log('keyvalues', keyvalues)

          // // check for step transitions to get timing info
          // //. genericize this, or let user write code
          // //. use message time, not new Date()
          // if (topic.includes('status')) {
          //   const step = payload.step
          //   if (step === 'Waiting') {
          //     // nothing
          //   } else if (step === 'Cycle_Start') {
          //     cycleStart = new Date().getTime() // ms
          //   } else if (step === 'Cycle_Finish') {
          //     if (cycleStart) {
          //       const cycleTime = (new Date().getTime() - cycleStart) / 1000 // sec
          //       // cache.set(`${deviceId}/status-cycle_time`, { value: cycleTime }) // sec
          //       // cache.set(`${deviceId}_status-cycle_time`, { value: cycleTime }) // sec
          //       cache.set(`${deviceId}-status_cycle_time`, { value: cycleTime }) // sec
          //       cycleStart = null
          //     }
          //   }
          // }

          // subscribe to any topics
          for (const entry of handler.subscribe || []) {
            const topic = replaceDeviceId(entry.topic)
            console.log(`MQTT subscribe to ${topic}`)
            mqtt.subscribe(topic)
          }

          msgHandled = true
        }
      })

      if (!msgHandled) {
        console.log(`MQTT WARNING: no handler for topic`, msgTopic)
      }
    }

    function replaceDeviceId(str) {
      return str.replace('${deviceId}', deviceId)
    }
  }
}
