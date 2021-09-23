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

console.log('hex', 'binary')
values.forEach(value => {
  console.log('0x' + value, '=>', parseInt(value, 16).toString(2).split(''))
})
