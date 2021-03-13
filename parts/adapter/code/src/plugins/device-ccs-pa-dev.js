function extractor(msg) {
  return JSON.parse(msg.payload.toString())
}

const extractors = {
  'l99/ccs/evt/read': extractor,
  'l99/ccs/evt/status': extractor,
}

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
