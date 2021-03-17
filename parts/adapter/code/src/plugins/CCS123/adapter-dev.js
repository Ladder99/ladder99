// adapter plugin code
// derived from parts/devices/definitions/ccs-pa and instances/CCS123.yaml etc

//. this is experimental for development

const topics = {
  sendQuery: 'l99/${serialNumber}/cmd/query',
  receiveQuery: 'l99/${serialNumber}/evt/query',
  receiveStatus: 'l99/${serialNumber}/evt/status',
  receiveRead: 'l99/${serialNumber}/evt/read',
}

const aliases = {}

// initialize the client plugin.
// queries the device for address space definitions, subscribes to topics.
export function init(mqtt, cache, serialNumber) {
  // add serialNumber to topics
  for (const key of Object.keys(topics)) {
    topics[key] = topics[key].replace('${serialNumber}', serialNumber)
  }
  console.log('MQTT topics', { topics })

  mqtt.subscribe(topics.receiveQuery)
  mqtt.publish(topics.sendQuery, '{}')

  mqtt.on('message', onMessage)

  function onMessage(topic, buffer) {
    console.log('MQTT onMessage', { topic })
    if (topic === topics.receiveQuery) {
      onQueryMessage(topic, buffer)
    }
  }

  function onQueryMessage(topic, buffer) {
    console.log('MQTT onQueryMessage', { topic })
    mqtt.unsubscribe(topics.receiveQuery)
    const msg = unpack(topic, buffer)
    for (const item of msg.payload) {
      const key = serialNumber + '-' + item.keys[0] // eg 'CCS123-%I0.10'
      cache.set(key, item)
      // add other keys to aliases
      for (const alias of item.keys.slice(1)) {
        aliases[alias] = item
      }
    }
    console.log('MQTT', { cache })

    // // best to subscribe to topics at this point,
    // // in case status or read messages come in BEFORE query results are delivered,
    // // which would clobber these values.
    // mqtt.subscribe(topics.receiveStatus, onStatusMessage)
    // mqtt.subscribe(topics.receiveRead, onReadMessage)
  }

  // function onStatusMessage(topic, buffer) {
  //   const obj = unpack(topic, buffer)
  //   cache.save(obj)
  // }

  // function onReadMessage(topic, buffer) {
  //   const obj = unpack(topic, buffer)
  //   if (!Array.isArray(obj.data)) {
  //     obj.data = [obj.data]
  //   }
  //   // cache.save(obj)
  //   for (const item of obj.data) {
  //     const key = serialNumber + '-' + item.address
  //     const value = 0
  //     cache.set(key, value)
  //   }
  // }
}

// unpack a message payload byte buffer and append some metadata.
function unpack(topic, buffer) {
  // console.log('unpack', { topic, buffer })
  const payload = JSON.parse(buffer.toString())
  const received = new Date()
  const msg = { topic, payload, received }
  return msg
}
