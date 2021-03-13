//. need more succinct code here - pattern matching lib or helper fns
function(lookup) {
  const names = {
    50: 'WAIT',
    100: 'WAIT',
    200: 'PROGRAM_STOPPED',
    250: 'WAIT',
    300: 'WAIT',
    400: 'ACTIVE',
  }
  const topic = 'l99/ccs/evt/status'
  const prop = 'state'
  return lookup(topic, prop, names)
}

