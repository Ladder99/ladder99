// adapter plugin code
// derived from parts/devices/definitions/ccs-pa and instances/CCS123.yaml etc

const device = 'ccs-pa'
const topics = {
  sendQuery: 'l99/ccs/cmd/query',
  receiveQuery: 'l99/ccs/evt/query',
  receiveStatus: 'l99/ccs/evt/status',
  receiveRead: 'l99/ccs/evt/read',
}

// initialize the client plugin.
// queries the device for address space definitions, subscribes to topics.
export function init(mqtt, cache) {
  mqtt.subscribe(topics.receiveQuery, onQueryResult)
  mqtt.send(topics.sendQuery, '{}')

  function onQueryResult(topic, payload) {
    mqtt.unsubscribe(topics.receiveQuery, onQueryResult)
    const obj = unpack(topic, payload)
    //. this will iterate over data items in the object,
    // save them to the cache, and call the shdr update fn.
    cache.save(obj)
  }

  // subscribe to topics
  mqtt.subscribe(topics.receiveStatus, onStatusMessage)
  mqtt.subscribe(topics.receiveRead, onReadMessage)

  function onStatusMessage(topic, payload) {
    const obj = unpack(topic, payload)
    cache.save(obj)
  }

  function onReadMessage(topic, payload) {
    const obj = unpack(topic, payload)
    cache.save(obj)
  }
}

// helpers

// unpack a message payload and append some metadata.
// eg converts JSON string payload to js.
export function unpack(topic, payload) {
  let data = JSON.parse(payload.toString())
  if (!Array.isArray(data)) {
    data = [data]
  }
  const received = new Date()
  const obj = { device, topic, data, received }
  return obj
}
