// mqtt-json
// adapter plugiin - subscribes to mqtt topics, receives messages,
// parses them out as JSON, updates cache values, which sends SHDR.

import libmqtt from 'mqtt' // see https://www.npmjs.com/package/mqtt

//. this might be useful
// map from aliases to items, e.g. "ccs-pa-001-IN10" -> { address: "%I0.9", ... }
// const aliases = {}

/**
 * initialize the client plugin.
 * queries the device for address space definitions, subscribes to topics.
 * inputs is the inputs.yaml file parsed to a js tree.
 */
export function init({ url, cache, deviceId, inputs }) {
  console.log('init', { deviceId })

  // connect to broker
  console.log(`MQTT connecting to broker on ${url}...`)
  const mqtt = libmqtt.connect(url)

  // handle connection
  mqtt.on('connect', function onConnect() {
    console.log(`MQTT connected to broker on ${url}`)

    // handle all incoming messages
    console.log(`MQTT registering generic message handler`)
    mqtt.on('message', onMessage)

    // subscribe to any topics defined
    for (const subscription of inputs.connect.subscribe) {
      const topic = subscription.topic.replace('${deviceId}', deviceId)
      console.log(`MQTT subscribing to ${topic}`)
      mqtt.subscribe(topic)
    }

    // publish to any topics defined
    for (const publishing of inputs.connect.publish) {
      const topic = publishing.topic.replace('${deviceId}', deviceId)
      console.log(`MQTT publishing to ${topic}`)
      mqtt.publish(topic, publishing.message)
    }

    console.log(`MQTT listening for messages...`)
  })

  /**
   * handle all incoming messages.
   * eg for ccs-pa, will have query, status, and read messages.
   * @param {string} msgTopic - the mqtt topic eg 'l99/ccs-pa-001/evt/query
   * @param {array} msgBuffer - an array of bytes (we assume to be a json string)
   */
  function onMessage(msgTopic, msgBuffer) {
    console.log('MQTT got message on topic', msgTopic)

    // unpack the mqtt json payload - get { topic, payload, receivedTime }
    const msg = unpack(msgTopic, msgBuffer)

    // get payload as var - used by handler.initialize - don't delete - @ts-ignore
    const payload = msg.payload

    // iterate over message handlers
    const handlers = Object.entries(inputs.handlers) // array of [topic, handler]
    handlers.forEach(([topic, handler]) => {
      topic = replaceDeviceId(topic)

      if (topic === msgTopic) {
        // unsubscribe from topics as needed
        for (const entry of handler.unsubscribe || []) {
          const topic = replaceDeviceId(entry.topic)
          console.log(`MQTT unsubscribe from ${topic}`)
          mqtt.unsubscribe(topic)
        }

        // initialize
        // eg assign payload values to $
        // eg prelim: 'payload.forEach(item => $[item.keys[0]] = item)'
        let $ = {} // a variable representing payload data
        if (handler.prelim) {
          eval(handler.prelim)
        }

        // lookup
        // eg lookup: '($, field) => ({ value: ($[field] || {}).default })'
        const lookup = eval(handler.lookup) // get the function itself
        console.log(lookup.toString())

        // inputs
        for (const key of Object.keys(handler.inputs) || []) {
          const id = deviceId + '-' + key // eg 'ccs-pa-001-fault_count'
          const field = handler.inputs[key] // eg '%M55.2'
          const item = lookup($, field) // evaluate the lookup function
          if (item && item.value !== undefined) {
            cache.set(id, item) // save to the cache - may send shdr to tcp
          }
        }

        // subscribe
        for (const subscription of handler.subscribe || []) {
          const topic = subscription.topic.replace('${deviceId}', deviceId)
          console.log(`MQTT subscribe to ${topic}`)
          mqtt.subscribe(topic)
        }
      }
    })

    // const handler = handlers[topic]
    // if (handler) {
    //   handler(msg)
    // } else {
    //   console.log(`MQTT WARNING: no handler for topic`, topic)
    // }
  }

  function replaceDeviceId(str) {
    return str.replace('${deviceId}', deviceId)
  }
}

/**
 * unpack a message buffer and append some metadata.
 * @param {string} topic
 * @param {object} buffer
 * @returns {{topic:string, payload:object, receivedTime:Date}}
 */
function unpack(topic, buffer) {
  const payload = JSON.parse(buffer.toString())
  const receivedTime = new Date()
  const msg = { topic, payload, receivedTime }
  return msg
}
