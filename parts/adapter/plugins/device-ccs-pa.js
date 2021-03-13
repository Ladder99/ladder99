//. need more succinct code here - pattern matching lib or helper fns
function(msgs, shdrs) {
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
  return lookup(msgs, shdrs, topic, prop, names)
  //. define elsewhere - 
  function lookup(msgs, shdrs, topic, prop, names) {
    const msg = msgs.get(topic)
    const value = msg[prop]
    const name = names[value]
    const shdr = `${msg.timestamp}|${prop}|${name}`
    const key = topic + '/' + prop
    shdrs.set(key, shdr)
    return shdr
  }
}

