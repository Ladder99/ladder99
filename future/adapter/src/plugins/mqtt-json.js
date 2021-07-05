// mqtt-json
// adapter plugiin - subscribes to mqtt topics, receives messages,
// parses them out as JSON, updates cache values, which sends SHDR.

import libmqtt from 'mqtt' // see https://www.npmjs.com/package/mqtt

let cycleStart

/**
 * initialize the client plugin.
 * queries the device for address space definitions, subscribes to topics.
 * inputs is the inputs.yaml file parsed to a js tree.
 */
export function init({ url, cache, deviceId, inputs }) {
  console.log('init', { deviceId })

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

  /**
   * handle incoming messages.
   * eg for ccs-pa have query, status, and read messages.
   * @param {string} msgTopic - mqtt topic, eg 'l99/ccs-pa-001/evt/query'
   * @param {array} msgBuffer - array of bytes (assumed to be a json string)
   */
  function onMessage(msgTopic, msgBuffer) {
    console.log('MQTT got message on topic', msgTopic)

    const receivedTime = new Date()

    // unpack the mqtt json payload, assuming it's a JSON string.
    // sets payload as variable - used by handler.initialize - don't delete - @ts-ignore
    const payload = JSON.parse(msgBuffer.toString())
    // let payload = JSON.parse(msgBuffer.toString())
    // if (!Array.isArray(payload)) payload = [payload] // wrap obj in array

    // iterate over message handlers - handlers is an array of [topic, handler]
    const handlers = Object.entries(inputs.handlers) || []
    let msgHandled = false
    handlers.forEach(([topic, handler]) => {
      topic = replaceDeviceId(topic)

      // eg msgTopic => 'l99/ccs-pa-001/evt/query'
      if (topic === msgTopic) {
        // unsubscribe from topics as needed
        for (const entry of handler.unsubscribe || []) {
          const topic = replaceDeviceId(entry.topic)
          console.log(`MQTT unsubscribe from ${topic}`)
          mqtt.unsubscribe(topic)
        }

        // initialize handler
        // eg can assign payload values to a dictionary $ here for fast lookups.
        // eg initialize: 'payload.forEach(item => $[item.keys[0]] = item)'
        console.log(`MQTT initialize handler`)
        let $ = {} // a variable representing payload data
        eval(handler.initialize)

        // define lookup function
        // eg lookup: '($, part) => ({ value: ($[part] || {}).default })'
        console.log(`MQTT define lookup function`)
        const lookup = eval(handler.lookup)

        // iterate over inputs - an array of [key, part], eg ['fault_count', '%M55.2'].
        // if part is in payload, add it to the cache.
        console.log(`MQTT iterate over inputs`)
        const inputs = Object.entries(handler.inputs) || []
        for (const [key, part] of inputs) {
          // use the lookup function to get item from payload, if there
          const item = lookup($, part)
          // if we have the part in the payload, add it to the cache
          if (item && item.value !== undefined) {
            console.log(`MQTT part '${part}' in payload - set cache`)
            const cacheId = deviceId + '-' + key // eg 'ccs-pa-001-fault_count'
            // item.receivedTime = receivedTime
            cache.set(cacheId, item) // save to the cache - may send shdr to tcp
          }
        }

        // check for step transitions to get timing info
        //. genericize this, or let user write code
        //. use message time, not new Date()
        if (topic.includes('status')) {
          const step = payload.step
          if (step === 'Waiting') {
            // nothing
          } else if (step === 'Cycle_Start') {
            cycleStart = new Date().getTime() // ms
          } else if (step === 'Cycle_Finish') {
            if (cycleStart) {
              const cycleTime = (new Date().getTime() - cycleStart) / 1000 // sec
              cache.set(`${deviceId}-status-cycle_time`, { value: cycleTime }) // sec
              cycleStart = null
            }
          }
        }

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
