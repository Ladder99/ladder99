//. this is experimental for development

export const handlers = {
  'l99/CCS123/evt/status': status,
  'l99/CCS123/evt/read': read,
}

function status() {}
function read() {}

export function getData(buffer) {
  let data = JSON.parse(buffer.toString())
  if (!Array.isArray(data)) {
    data = [data]
  }
  return data
}

// // get output for given item and cache
// function getOutput(cache, item) {}

// export function getState(lookup) {
//   const topic = 'l99/ccs/evt/status'
//   const prop = 'state'
//   const names = {
//     50: 'WAIT',
//     100: 'WAIT',
//     200: 'PROGRAM_STOPPED',
//     250: 'WAIT',
//     300: 'WAIT',
//     400: 'ACTIVE',
//   }
//   return lookup(topic, prop, names)
// }

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
