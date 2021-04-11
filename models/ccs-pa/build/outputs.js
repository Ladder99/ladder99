// list of output calculations to run on cache values to get SHDR key/value pairs.

//. this will be extracted/compiled from outputs.yaml.

import types from './types.js'

const outputTemplates = [
  {
    dependsOn: ['${deviceId}-status-connection'],
    key: '${deviceId}-connection',
    value: 'types.AVAILABILITY[<status-connection>]',
  },
  {
    dependsOn: ['${deviceId}-%Q0.0'],
    key: '${deviceId}-printer_start_print',
    value: 'types.ACTUATOR_STATE[<%Q0.0>]',
  },
  {
    dependsOn: ['${deviceId}-%I0.10', '${deviceId}-status-faults'],
    key: '${deviceId}-e_stop',
    // value: cache => {
    //   const i010 = cache.get('${deviceId}-%I0.10').value
    //   const faults = cache.get('${deviceId}-status-faults')
    //   return i010 || (faults && faults[10]) ? 'TRIGGERED' : 'ARMED'
    //   // return types.EMERGENCY_STOP[i010 || (faults && faults[10])]
    // },
    value: 'foo',
  },
  {
    dependsOn: ['${deviceId}-status-state'],
    key: '${deviceId}-state',
    value: 'types.EXECUTION[<status-state>]',
  },
  {
    dependsOn: ['${deviceId}-status-cycle_time'],
    key: '${deviceId}-status-cycle_time',
    value: '<status-cycle_time>',
  },

  // // these come from models/rockwell-hmi
  // {
  //   dependsOn: ['${deviceId}-operator'],
  //   key: '${deviceId}-operator',
  //   value: <operator>,
  // },
]

export function getOutputs({ deviceId }) {
  const outputs = outputTemplates.map(template => {
    const str = template.value.replace(/(foo)/g, 'pok')
    //. check if str is multiline - then need to wrap in braces etc?
    const value = cache => eval(str)
    const output = {
      dependsOn: template.dependsOn.map(s =>
        s.replace('${deviceId}', deviceId)
      ),
      key: template.key.replace('${deviceId}', deviceId),
      // value: cache => cache.get(`${deviceId}-operator`).value,
      value,
    }
    console.log({ output })
    console.log({ str })
    return output
  })
  return outputs
}
