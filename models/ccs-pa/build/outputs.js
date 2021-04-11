// list of output calculations to run on cache values to get SHDR key/value pairs.

//. this will be extracted/compiled from outputs.yaml.

import types from './types.js'

//. if exported a fn to wrap this, could pass in the deviceId,
// possibly making it easier to have multiple devices/sources of this type.

export default [
  {
    dependsOn: ['ccs-pa-001-status-connection'],
    key: 'ccs-pa-001-connection',
    value: cache =>
      types.AVAILABILITY[cache.get('ccs-pa-001-status-connection').value],
  },
  {
    dependsOn: ['ccs-pa-001-%Q0.0'],
    key: 'ccs-pa-001-printer_start_print',
    value: cache =>
      cache.get('ccs-pa-001-%Q0.0').value ? 'ACTIVE' : 'INACTIVE',
    // types.ACTUATOR_STATE[cache.get('ccs-pa-001-%Q0.0')],
  },
  {
    dependsOn: ['ccs-pa-001-%I0.10', 'ccs-pa-001-status-faults'],
    key: 'ccs-pa-001-e_stop',
    value: cache => {
      const i010 = cache.get('ccs-pa-001-%I0.10').value
      const faults = cache.get('ccs-pa-001-status-faults')
      return i010 || (faults && faults[10]) ? 'TRIGGERED' : 'ARMED'
      // return types.EMERGENCY_STOP[i010 || (faults && faults[10])]
    },
  },
  {
    dependsOn: ['ccs-pa-001-status-state'],
    key: 'ccs-pa-001-state',
    value: cache => types.EXECUTION[cache.get('ccs-pa-001-status-state').value],
  },
  {
    dependsOn: ['ccs-pa-001-status-cycle_time'],
    key: 'ccs-pa-001-status-cycle_time',
    value: cache => cache.get('ccs-pa-001-status-cycle_time').value,
  },

  // // these come from models/rockwell-hmi
  // {
  //   dependsOn: ['ccs-pa-001-operator'],
  //   key: 'ccs-pa-001-operator',
  //   value: cache => cache.get('ccs-pa-001-operator').value,
  // },
]
