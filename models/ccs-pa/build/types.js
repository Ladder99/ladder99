export default {
  AVAILABILITY: {
    online: 'AVAILABLE',
    offline: 'UNAVAILABLE',
  },
  EXECUTION: {
    50: 'WAIT',
    100: 'WAIT',
    200: 'PROGRAM_STOPPED',
    250: 'WAIT',
    300: 'WAIT',
    400: 'ACTIVE',
  },
  ACTUATOR_STATE: {
    0: 'INACTIVE',
    1: 'ACTIVE',
  },
  EMERGENCY_STOP: {
    false: 'ARMED',
    true: 'TRIGGERED',
  },
  // CONDITION_TRIPLE:
  //   2: NORMAL
  //   1: WARNING
  //   0: FAULT

  // FAULT_CONDITION:
  //   false: NORMAL
  //   true: FAULT

  // WARN_CONDITION:
  //   false: NORMAL
  //   true: WARNING

  // PART_DETECT:
  //   0: NOT_PRESENT
  //   1: PRESENT
}
