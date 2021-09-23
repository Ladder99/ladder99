const str =
  '\x02\r\n\r\nPRINTER STATUS            \r\n   ERRORS:          1 00000000 00010004  \r\n   WARNINGS:        0 00000000 00000000   \r\n\x03'
console.log(str)

const regex =
  /.*PRINTER STATUS.*\r\n.*ERRORS.*(\d) (\d+) (\d+).*\r\n.*WARNINGS.*(\d) (\d+) (\d+).*/
console.log(regex)

const match = str.match(regex)
// console.log(match)

const values = match.slice(1)
console.log(values)

// console.log('hex', 'binary')
// values.forEach(value => {
//   console.log('0x' + value, '=>', parseInt(value, 16).toString(2).split(''))
// })

const binaries = values.map(value => parseInt(value, 16).toString(2).split(''))
console.log(binaries)

const errorPresent = binaries[0][0] === '1'
const warningPresent = binaries[3][0] === '1'
console.log(errorPresent, warningPresent)

// const flags = binaries.map(binary => binary.map(digit => digit === '1'))
// console.log(flags)
