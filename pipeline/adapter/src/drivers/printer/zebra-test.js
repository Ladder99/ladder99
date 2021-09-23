import * as parsers from './zebra-parsers.js'

const s1 =
  '\x02\r\n\r\nPRINTER STATUS            \r\n   ERRORS:          1 00000000 00010004  \r\n   WARNINGS:        1 00000000 00000100   \r\n\x03'
console.log(s1)
const ret1 = parsers.parseHQES(s1)
console.log(ret1)

const s2 = `\x02030,1,1,1225,000,0,0,0,000,0,0,0\x03\r\n\x02001,0,0,1,1,2,6,0,00000000,1,000\x03\r\n\x021234,0\x03\r\n`
console.log(s2)
const ret2 = parsers.parseHS(s2)
console.log(ret2)
