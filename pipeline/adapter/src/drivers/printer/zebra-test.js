const str =
  '\x02\r\n\r\nPRINTER STATUS            \r\n   ERRORS:          1 00000000 00010004  \r\n   WARNINGS:        0 00000000 00000100   \r\n\x03'
console.log(str)

const regex =
  /.*PRINTER STATUS.*\r\n.*ERRORS.*(\d) (\d+) (\d+).*\r\n.*WARNINGS.*(\d) (\d+) (\d+).*/
console.log(regex)

const match = str.match(regex)
// console.log(match)

// get values
// eg [ '1', '00000000', '00010004', '0', '00000000', '00000000' ]
const values = match.slice(1)
console.log(values)

// get hexes
const hexes = values.map(value => parseInt(value, 16))
// console.log(hexes)

// console.log('hex', 'binary')
// values.forEach(value => {
//   console.log('0x' + value, '=>', parseInt(value, 16).toString(2).split(''))
// })

// get binaries
// eg[['1'], ['0'], ['1', '0', '0', '0', ...], ['0'],...]
// const binaries = hexes.map(hex => hex.toString(2).split(''))
// console.log(binaries)

// const errorPresent = binaries[0][0] === '1'
// const warningPresent = binaries[3][0] === '1'
// console.log(errorPresent, warningPresent)

// const flags = binaries.map(binary => binary.map(digit => digit === '1'))
// console.log(flags)

// No Error,0,000000,0,00000000
// Error Present,1,0000000,0,XXXXXXXX

const errorFlags = hexes[2]
const warningFlags = hexes[5]

// note: these keys get converted to decimal strings
const hexErrors = {
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

const errorKeys = Object.keys(hexErrors)
const errorValues = errorKeys.map(errorKey => parseInt(errorKey))
const foundValues = errorValues.filter(errorValue => errorFlags & errorValue)
const foundErrors = foundValues.map(foundValue => hexErrors[foundValue])
console.log(foundErrors)

const hexWarnings = {
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

const warningKeys = Object.keys(hexWarnings)
const warningValues = warningKeys.map(key => parseInt(key))
const foundWarningValues = warningValues.filter(value => warningFlags & value)
const foundWarnings = foundWarningValues.map(value => hexWarnings[value])
console.log(foundWarnings)
