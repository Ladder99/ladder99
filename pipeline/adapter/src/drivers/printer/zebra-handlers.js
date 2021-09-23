// note: these keys get converted to decimal strings
const errorDict = {
  0x1: 'Media Out',
  0x2: 'Ribbon Out',
  0x4: 'Head Open',
  0x8: 'Cutter Fault',

  0x10: 'Printhead Over Temperature',
  0x20: 'Motor Over Temperature',
  0x40: 'Bad Printhead Element',
  0x80: 'Printhead Detection Error',

  0x100: 'Invalid Firmware Config',
  0x200: 'Printhead Thermistor Open',
  0x400: 'Paper Feed Error',

  0x1000: 'Paper Jam during Retract',
  0x2000: 'Presenter Not Running',
  0x8000: 'Clear Paper Path Failed',

  0x10000: 'Paused',
  0x20000: 'Retract Function timed out',
  0x40000: 'Black Mark Calabrate Error',
  0x80000: 'Black Mark not Found',
}
const errorKeys = Object.keys(errorDict).map(errorKey => parseInt(errorKey))
const errors = { dict: errorDict, keys: errorKeys }

const warningDict = {
  0x1: 'Need to Calibrate Media',
  0x2: 'Clean Printhead',
  0x4: 'Replace Printhead',
  0x8: 'Paper-near-end Sensor',

  0x10: 'Sensor 1 (Paper before head)',
  0x20: 'Sensor 2 (Black mark)',
  0x40: 'Sensor 3 (Paper after head)',
  0x80: 'Sensor 4 (loop ready)',

  0x100: 'Sensor 5 (presenter)',
  0x200: 'Sensor 6 (retract ready)',
  0x400: 'Sensor 7 (in retract)',
  0x800: 'Sensor 8 (at bin)',
}
const warningKeys = Object.keys(warningDict).map(key => parseInt(key))
const warnings = { dict: warningDict, keys: warningKeys }

export { errors, warnings }
