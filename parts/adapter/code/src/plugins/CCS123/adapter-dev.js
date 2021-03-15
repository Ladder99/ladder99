// adapter plugin code
// derived from parts/devices/definitions/ccs-pa and instances/CCS123.yaml etc

//. this is experimental for development

// const device = 'ccs-pa'
const topics = {
  sendQuery: 'l99/CCS123/cmd/query',
  receiveQuery: 'l99/CCS123/evt/query',
  receiveStatus: 'l99/CCS123/evt/status',
  receiveRead: 'l99/CCS123/evt/read',
}

// unpack a message payload byte buffer and append some metadata.
export function unpack(topic, payloadBuffer) {
  let data = JSON.parse(payloadBuffer.toString())
  if (!Array.isArray(data)) {
    data = [data]
  }
  const received = new Date()
  const obj = { topic, data, received }
  return obj
}

// initialize the client plugin.
// queries the device for address space definitions, subscribes to topics.
export function init(mqtt, cache) {
  mqtt.subscribe(topics.receiveQuery, onQueryResult)
  mqtt.send(topics.sendQuery, '{}')

  function onQueryResult(topic, payload) {
    mqtt.unsubscribe(topics.receiveQuery, onQueryResult)
    const obj = unpack(topic, payload)
    cache.save(obj)

    //. best to subscribe to topics at this point,
    // in case status or read messages come in BEFORE this message is delivered.
    // alternative is to say mqtt.subscribe(topic), and mqtt.on('message', (topic, buffer)=>...)
    mqtt.subscribe(topics.receiveStatus, onStatusMessage)
    mqtt.subscribe(topics.receiveRead, onReadMessage)
  }

  function onStatusMessage(topic, payload) {
    const obj = unpack(topic, payload)
    cache.save(obj)
  }

  function onReadMessage(topic, payload) {
    const obj = unpack(topic, payload)
    cache.save(obj)
  }
}

// // subscribe and handle topics
// function subscribe(mqtt, cache) {
//   // alternative is to say mqtt.subscribe(topic), and mqtt.on('message', (topic, buffer)=>...)
//   mqtt.subscribe(topics.receiveStatus, onStatusMessage)
//   mqtt.subscribe(topics.receiveRead, onReadMessage)

//   function onStatusMessage(topic, payload) {
//     const obj = unpack(topic, payload)
//     cache.save(obj)
//   }

//   function onReadMessage(topic, payload) {
//     const obj = unpack(topic, payload)
//     cache.save(obj)
//   }
// }
