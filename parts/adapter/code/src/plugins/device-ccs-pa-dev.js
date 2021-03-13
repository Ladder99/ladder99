// get extractor for given topic
export function getExtractor(topic) {
  return extract // same for all topics
}
// get payload data from payload buffer/array
function extract(payloadBuffer) {
  return JSON.parse(payloadBuffer.toString())
}

// get transform for given topic
export function getTransformer(topic) {
  return transformRead
}
// get shdr for given payload data
function transformRead(payloadData) {}

export function getState(lookup) {
  const topic = 'l99/ccs/evt/status'
  const prop = 'state'
  const names = {
    50: 'WAIT',
    100: 'WAIT',
    200: 'PROGRAM_STOPPED',
    250: 'WAIT',
    300: 'WAIT',
    400: 'ACTIVE',
  }
  return lookup(topic, prop, names)
}
