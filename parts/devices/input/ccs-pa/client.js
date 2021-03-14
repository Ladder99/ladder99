// client sits between broker and adapter

export function init(broker, adapter) {
  const topicQuerySend = 'l99/ccs/cmd/query'
  const topicQueryResult = 'l99/ccs/evt/query'

  broker.subscribe(topicQueryResult, onQueryResult)
  broker.send(topicQuerySend, '{}')

  function onQueryResult(msg) {
    broker.unsubscribe(topicQueryResult, onQueryResult)
    const unpack = getUnpack()
    const data = unpack(msg)
    adapter.send(data)
  }
}

// (can ignore topic as all messages from this device are the same)
export function getUnpack(topic) {
  return msg => JSON.parse(msg.payload.toString())
}
