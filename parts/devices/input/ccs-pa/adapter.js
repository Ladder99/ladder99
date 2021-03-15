const device = 'ccs-pa'
const topicQuerySend = 'l99/ccs/cmd/query'
const topicQueryResult = 'l99/ccs/evt/query'

// initialize the client plugin.
// queries the device for address space definitions.
export function init(broker, adapter) {
  broker.subscribe(topicQueryResult, onQueryResult)
  broker.send(topicQuerySend, '{}')

  function onQueryResult(msg) {
    broker.unsubscribe(topicQueryResult, onQueryResult)
    const unpack = getUnpack()
    const obj = unpack(msg)
    adapter.send(obj) //.
  }
}

// get unpack function
// (can ignore topic as all messages from this device are the same)
export function getUnpack(topic) {
  // unpack a message payload (eg JSON string to js) and append some metadata.
  return function unpack(msg) {
    const obj = { ...msg }
    obj.device = device
    obj.received = new Date()
    obj.data = JSON.parse(msg.payload.toString())
    return obj
  }
}
