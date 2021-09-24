// parsers for printer responses

// HQES

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

const regex =
  /.*PRINTER STATUS.*\r\n.*ERRORS.*(\d) (\d+) (\d+).*\r\n.*WARNINGS.*(\d) (\d+) (\d+).*/

export function parseHQES(str) {
  const match = str.match(regex)
  const values = match.slice(1) // eg [ '1', '00000000', '00010004', '0', '00000000', '00000000' ]
  const hexes = values.map(value => parseInt(value, 16))

  // const binaries = hexes.map(hex => hex.toString(2).split(''))
  // const flags = binaries.map(binary => binary.map(digit => digit === '1'))
  // const errorPresent = values[0] === '1'
  // const warningPresent = values[3] === '1'

  const errorFlags = hexes[2]
  const foundValues = errors.keys.filter(errorValue => errorFlags & errorValue)
  const foundErrors = foundValues.map(foundValue => errors.dict[foundValue])
  // console.log(foundErrors)

  const warningFlags = hexes[5]
  const foundWarningKeys = warnings.keys.filter(value => warningFlags & value)
  const foundWarnings = foundWarningKeys.map(value => warnings.dict[value])
  // console.log(foundWarnings)

  const msgs = [
    ...foundErrors.map(error => `ERROR: ${error}`),
    ...foundWarnings.map(warning => `WARNING: ${warning}`),
  ].join(', ')

  return { errors: foundErrors, warnings: foundWarnings, msgs }
}

// HS

export function parseHS(str) {
  const values = str
    .split('')
    .filter(c => c !== '\x02' && c !== '\x03')
    .join('')
    .split('\n')
    .map(line => line.trim())
    .join(',')
    .split(',')
  const paperOut = values[1] === '1'
  const pause = values[2] === '1'
  const bufferFull = values[5] === '1'
  const corruptRam = values[9] === '1'
  const underTemperature = values[10] === '1'
  const overTemperature = values[11] === '1'
  const headUp = values[14] === '1'
  const ribbonOut = values[15] === '1'
  const labelsRemaining = parseInt(values[20])
  const ret = {
    paperOut,
    pause,
    bufferFull,
    corruptRam,
    underTemperature,
    overTemperature,
    headUp,
    ribbonOut,
    labelsRemaining,
  }
  return ret
}

// HD

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
