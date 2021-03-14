// client sits between broker and adapter

export function init(broker, adapter) {
  const topic = 'l99/ccs/evt/query'
  broker.onMessage = onQueryResult
  broker.subscribe(topic)
  function onQueryResult(msg) {
    const unpack = getUnpack(topic)
    const data = unpack(msg)
    //. shovel data off to adapter
    adapter.shovel(data)
    broker.onMessage = null
  }
}

export function getUnpack(topic) {
  return msg => JSON.parse(msg.payload.toString())
}
