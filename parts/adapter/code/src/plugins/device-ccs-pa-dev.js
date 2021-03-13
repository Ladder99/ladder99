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
  // return lookup({
  //   topic: 'l99/ccs/evt/status',
  //   prop: 'state',
  //   names: {
  //     50: 'WAIT',
  //     100: 'WAIT',
  //     200: 'PROGRAM_STOPPED',
  //     250: 'WAIT',
  //     300: 'WAIT',
  //     400: 'ACTIVE',
  //   }
  // })
}
