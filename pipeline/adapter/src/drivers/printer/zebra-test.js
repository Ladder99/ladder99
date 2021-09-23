import { errors, warnings } from './zebra-handlers.js'

//

const str =
  '\x02\r\n\r\nPRINTER STATUS            \r\n   ERRORS:          1 00000000 00010004  \r\n   WARNINGS:        1 00000000 00000100   \r\n\x03'
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

const errorPresent = values[0] === '1'
const warningPresent = values[3] === '1'
console.log(errorPresent, warningPresent)

// get hexes
const hexes = values.map(value => parseInt(value, 16))
// console.log(hexes)

// const binaries = hexes.map(hex => hex.toString(2).split(''))
// console.log(binaries)

// const flags = binaries.map(binary => binary.map(digit => digit === '1'))
// console.log(flags)

const errorFlags = hexes[2]
const warningFlags = hexes[5]

const foundValues = errors.keys.filter(errorValue => errorFlags & errorValue)
const foundErrors = foundValues.map(foundValue => errors.dict[foundValue])
console.log(foundErrors)

const foundWarningKeys = warnings.keys.filter(value => warningFlags & value)
const foundWarnings = foundWarningKeys.map(value => warnings.dict[value])
console.log(foundWarnings)
