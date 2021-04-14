// mqtt-json
// adapter plugiin - subscribes to mqtt topics, receives messages,
// parses them out as json, updates cache.

import libmqtt from 'mqtt' // see https://www.npmjs.com/package/mqtt

// // map from aliases to items, e.g. "ccs-pa-001-IN10" -> { address: "%I0.9", ... }
// const aliases = {}

/**
 * initialize the client plugin.
 * queries the device for address space definitions, subscribes to topics.
 * inputs is the inputs.yaml file parsed to a js tree.
 */
export function init({ url, cache, deviceId, inputs }) {
  console.log('init', { deviceId })

  console.log(`MQTT connecting to broker on ${url}...`)
  const mqtt = libmqtt.connect(url)

  mqtt.on('connect', function onConnect() {
    console.log(`MQTT connected to broker on ${url}`)

    console.log(`MQTT registering generic message handler`)
    mqtt.on('message', onMessage)

    console.log(`MQTT subscribing to topics...`)
    const subscriptions = inputs.connect.subscribe
    for (const subscription of subscriptions) {
      const topic = subscription.topic.replace('${deviceId}', deviceId)
      console.log(`MQTT subscribing to ${topic}`)
      mqtt.subscribe(topic)
    }

    console.log(`MQTT publishing topics...`)
    const publishings = inputs.connect.publish
    for (const publishing of publishings) {
      const topic = publishing.topic.replace('${deviceId}', deviceId)
      console.log(`MQTT publishing to ${topic}`)
      mqtt.publish(topic, publishing.message)
    }

    console.log(`MQTT listening for messages...`)
  })

  // handle all incoming messages
  function onMessage(topic, buffer) {
    console.log('MQTT got message on topic', topic)

    const msg = unpack(topic, buffer)
    const payload = msg.payload

    Object.entries(inputs.topics).forEach(([key, handler]) => {
      key = key.replace('${deviceId}', deviceId)

      if (topic === key) {
        // execute handler commands

        // unsubscribe
        for (const unsubscription of handler.unsubscribe) {
          const topic = unsubscription.topic.replace('${deviceId}', deviceId)
          console.log(`MQTT unsubscribe from ${topic}`)
          mqtt.unsubscribe(topic)
        }

        // prelim
        let $
        if (handler.prelim) {
          eval(handler.prelim) // assign values to $
        }
        console.log({ $ })

        // lookup
        const lookup = eval(handler.lookup)
        console.log({ lookup })

        // inputs
        for (const key of Object.keys(handler.inputs)) {
          const id = deviceId + '-' + key
          const value = handler.inputs[key]
          console.log(`lookup value ${value} for id ${id}`)
          const item = lookup($, value)
          cache.set(id, item)
        }

        // subscribe
        for (const subscription of handler.subscribe) {
          const topic = subscription.topic.replace('${deviceId}', deviceId)
          console.log(`MQTT subscribe to ${topic}`)
          mqtt.subscribe(topic)
        }
      }
    })

    // const handlers = {
    //   [topics.receiveQuery]: onQueryMessage,
    //   [topics.receiveStatus]: onStatusMessage,
    //   [topics.receiveRead]: onReadMessage,
    // }
    // const handler = handlers[topic]
    // if (handler) {
    //   handler(msg)
    // } else {
    //   console.log(`MQTT WARNING: no handler for topic`, topic)
    // }
  }
}

// unpack a message payload byte buffer and append some metadata.
function unpack(topic, buffer) {
  const payload = JSON.parse(buffer.toString())
  const received = new Date()
  const msg = { topic, payload, received }
  return msg
}
