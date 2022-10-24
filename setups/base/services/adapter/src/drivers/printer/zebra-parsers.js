// parsers for printer responses

// ~HS - p212
// response looks like:
//   030,1,1,1225,000,0,0,0,000,0,0,0
//  001,0,0,1,1,2,6,0,00000000,1,000
//  1234,0
export function parseHS(str) {
  const values = str
    // remove \x02 and \x03 characters
    .split('')
    .filter(c => c !== '\x02' && c !== '\x03')
    .join('')
    // split to lines and trim
    .split('\n')
    .map(line => line.trim())
    // join the lines together
    .join(',')
    // split all values apart
    .split(',')
    // convert to integers
    .map(s => parseInt(s))
  const errors = []
  const warnings = []
  if (values[1]) errors.push('Paper Out')
  if (values[2]) errors.push('Pause')
  if (values[5]) errors.push('Buffer Full')
  if (values[9]) errors.push('Corrupt RAM')
  if (values[10]) errors.push('Under Temperature')
  if (values[11]) errors.push('Over Temperature')
  if (values[14]) errors.push('Head Up')
  if (values[15]) errors.push('Ribbon Out')
  const labelsRemaining = values[20]
  const ret = { errors, warnings, labelsRemaining }
  return ret
}

// ~HQES

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
const errorIndex = { dict: errorDict, keys: errorKeys }

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
const warningIndex = { dict: warningDict, keys: warningKeys }

// response string is like:
//   PRINTER STATUS
//   ERRORS:         1 00000000 00010003
//   WARNINGS:       0 00000000 00000000
const regex =
  /.*PRINTER STATUS.*\r\n.*ERRORS.*(\d) (\d+) (\d+).*\r\n.*WARNINGS.*(\d) (\d+) (\d+).*/

export function parseHQES(str) {
  const match = str.match(regex)
  if (match) {
    const hexes = match.slice(1) // eg [ '1', '00000000', '00010004', '0', '00000000', '00000000' ]
    const values = hexes.map(hex => parseInt(hex, 16)) // eg [1, 0, 812708, 0, 0, 0]

    // const errorPresent = digits[0] === '1'
    const errorValues = values[2] // eg 256
    const errorKeys = errorIndex.keys.filter(key => errorValues & key)
    const errors = errorKeys.map(key => errorIndex.dict[key])

    // const warningPresent = digits[3] === '1'
    const warningValues = values[5] // eg 7
    const warningKeys = warningIndex.keys.filter(key => warningValues & key)
    const warnings = warningKeys.map(key => warningIndex.dict[key])

    return { errors, warnings }
  }
  return { errors: [], warnings: [] }
}

// ~HD

// eg
// Head Temp = 30 C
// Ambient Temp = 31
// Head Test = Passed
// Darkness Adjust = 15.0
// Print Speed = 8
// Slew Speed = 8
// Backfeed Speed = 8
// Static_pitch_length = 1246
// Dynamic_pitch_length = 1262
// Max_dynamic_pitch_length = 1271
// Min_dynamic_pitch_length = 1256
// COMMAND PFX = ~ : FORMAT PFX = ^ : DELIMITER = ,
// P30 INTERFACE = None
// P31 INTERFACE = None
// P32 INTERFACE = PAX2 RTS Option         Revision 23
// P33 INTERFACE = Power Supply Option     Revision 16
// P34 INTERFACE = Applicator Option
// P35 INTERFACE = None
// Dynamic_top_position = 0009
// No ribbon A/D = 0000
// PCB Temp = None

export function parseHD(str) {
  const pairs = str
    .split('')
    .filter(c => c !== '\x02' && c !== '\x03' && c !== '\r')
    .join('')
    .split('\n')
    .map(line => line.split(' = '))
  const d = {}
  pairs.forEach(pair => (d[pair[0]] = pair[1]))
  return d
}

const regex2 = /.*TOTAL NONRESETTABLE:[ ]*(\d+).*/

export function parseHQOD(str) {
  const match = str.match(regex2)
  if (match) {
    const value = match[1]
    return value
  }
}
