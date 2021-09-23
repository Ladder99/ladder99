import * as parsers from './zebra-parsers.js'

const str =
  '\x02\r\n\r\nPRINTER STATUS            \r\n   ERRORS:          1 00000000 00010004  \r\n   WARNINGS:        1 00000000 00000100   \r\n\x03'
console.log(str)
const ret = parsers.parseHQES(str)
console.log(ret)
