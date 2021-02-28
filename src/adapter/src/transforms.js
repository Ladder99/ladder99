// transforms
// define transforms from mqtt json to shdr.
// exported functions should be named after the message topics.

// note: if using the device simulator in device/messages.js those message
// topics should match these exported function names.

const connections = {
  online: 'AVAILABLE',
  offline: 'UNAVAILABLE',
}
const states = {
  400: 'ACTIVE',
  200: 'STOPPED',
}

function getTimestamp(ts) {
  if (ts) {
    return new Date(ts).toISOString()
  }
  return new Date().toISOString()
}

export function status(json) {
  const timestamp = getTimestamp(json._ts)
  const shdr = `
${timestamp}
|connection|${connections[json.connection]}
|state|${states[json.state]}
|program|${json.program}
|step|${json.step}
`
    .trim()
    .replace(/\n/g, '')
  return shdr
}

function read(json) {
  const timestamp = getTimestamp()
  if (!Array.isArray(json)) {
    json = [json]
  }
  const shdr =
    timestamp + json.map(item => `|${item.address}|${item.value}`).join('')
  return shdr
}

const transforms = {
  'l99/ccs/evt/status': status,
  'l99/ccs/evt/read': read,
}

export default transforms
