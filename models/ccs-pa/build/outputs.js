// list of calculations to run on cache values to get shdr key/value pairs.

//. this will be extracted/compiled from outputs and types yamls.

import fs from 'fs' // node lib for filesys
import libyaml from 'js-yaml' // https://github.com/nodeca/js-yaml

const yamlfile = '../types.yaml'
const yaml = fs.readFileSync(yamlfile, 'utf8')
const yamltree = libyaml.load(yaml)
// @ts-ignore okay to cast here
const { types } = yamltree

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
