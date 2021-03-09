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

// map mqtt topics to transform functions
const transforms = {
  'l99/ccs/evt/status': status,
  'l99/ccs/evt/read': read,
}

/**
 * status message transform
 * @param {object} msg - status message, eg
 *   { _ts, connection, state, program, step }
 * @returns {string} SHDR string, eg
 *   2021-03-09T12:42:00.000Z|connection|AVAILABLE
 *   2021-03-09T12:42:00.000Z|state|ACTIVE
 *   ...
 */
export function status(msg) {
  const timestamp = getTimestamp(msg._ts)
  const shdr = `
${timestamp}|connection|${connections[msg.connection]}
${timestamp}|state|${states[msg.state]}
${timestamp}|program|${msg.program}
${timestamp}|step|${msg.step}
`.trim()
  return shdr
}

/**
 * read/address message transform
 * @param {object|object[]} msg - [{address,value},...]
 * @returns {string} SHDR string, eg
 *   2021-03-09T12:42:00.000Z|%Q0.1|0
 *   2021-03-09T12:42:00.000Z|%Q0.7|1
 */
function read(msg) {
  const timestamp = getTimestamp()
  if (!Array.isArray(msg)) {
    msg = [msg]
  }
  const shdr = msg
    .map(item => `${timestamp}|${item.address}|${item.value}`)
    .join('\n')
  return shdr
}

// get a timestamp as ISO string eg '2021-03-05T05:28:00'
function getTimestamp(ts) {
  if (ts) {
    return new Date(ts).toISOString()
  }
  return new Date().toISOString()
}

export default transforms
