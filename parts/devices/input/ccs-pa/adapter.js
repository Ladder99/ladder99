const device = 'ccs-pa'
const topicQuerySend = 'l99/ccs/cmd/query'
const topicQueryResult = 'l99/ccs/evt/query'

// initialize the client plugin.
// queries the device for address space definitions.
export function init(broker, cache) {
  broker.subscribe(topicQueryResult, onQueryResult)
  broker.send(topicQuerySend, '{}')

  function onQueryResult(msg) {
    broker.unsubscribe(topicQueryResult, onQueryResult)
    const unpack = getUnpack()
    const obj = unpack(msg)
    cache.set(obj) //.
  }
}

// get unpack function
// (can ignore topic as all messages from this device are the same)
export function getUnpack(topic) {
  // unpack a message payload and append some metadata.
  // eg converts JSON string payload to js.
  return function unpack(msg) {
    const obj = { ...msg }
    obj.data = JSON.parse(msg.payload.toString())
    obj.device = device
    obj.received = new Date()
    return obj
  }
}
