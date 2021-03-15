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
export function init(broker, cache) {
  broker.subscribe(topics.receiveQuery, onQueryResult)
  broker.send(topics.sendQuery, '{}')

  function onQueryResult(topic, payload) {
    broker.unsubscribe(topics.receiveQuery, onQueryResult)
    const obj = unpack(topic, payload)
    cache.set(obj)
  }

  // subscribe to topics
  broker.subscribe(topics.receiveStatus, onStatusMessage)
  broker.subscribe(topics.receiveRead, onReadMessage)

  function onStatusMessage(topic, payload) {
    const obj = unpack(topic, payload)
    cache.set(obj)
  }

  function onReadMessage(topic, payload) {
    const obj = unpack(topic, payload)
    cache.set(obj)
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
