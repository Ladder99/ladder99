// define list of calculations to run on cache values to get shdr key/value pairs.
// this is extracted/compiled from calcs.yaml.

const calcs = [
  {
    dependsOn: ['CCS123-%Q0.0'],
    // key: 'CCS123-%Q0.0',
    key: 'CCS123-printer_start_print',
    value: cache =>
      cache.get('CCS123-%Q0.0').value === 0 ? 'INACTIVE' : 'ACTIVE',
    // types.ACTUATOR_STATE[cache.get('CCS123-%Q0.0')],
  },
  {
    // <Source>%I0.10 OR status.faults 10</Source>
    dependsOn: ['CCS123-%I0.10', 'CCS123-status-faults'],
    key: 'CCS123-estop',
    value: cache => {
      const i010 = cache.get('CCS123-%I0.10').value
      const faults = cache.get('CCS123-status-faults')
      return i010 || (faults && faults[10]) ? 'TRIGGERED' : 'ARMED'
      // return types.EMERGENCY_STOP[i010 || (faults && faults[10])]
    },
  },
]

// get all shdr outputs for the cache values
function getOutput(cache) {
  const output = []
  for (const calc of calcs) {
    const timestamp = new Date().toISOString()
    const key = calc.key
    const value = calc.value(cache) // do calculation
    const shdr = `${timestamp}|${key}|${value}`
    console.log(shdr)
    output.push(shdr)
  }
  return output.join('\n') + '\n'
}
