// get getData for given mqtt topic
export function getGetData(topic) {
  return getData // same for all topics
}
// get payload data from payload buffer/array
function getData(buffer) {
  return JSON.parse(buffer.toString())
}

// get shdr transform for given topic
export function getGetShdr(topic) {
  return getShdr
}
// get shdr for given payload data
function getShdr(payloadData) {}

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
