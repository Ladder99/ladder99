import * as parsers from './zebra-parsers.js'

// HQES

const s1 =
  '\x02\r\n\r\nPRINTER STATUS            \r\n   ERRORS:          1 00000000 00010004  \r\n   WARNINGS:        1 00000000 00000100   \r\n\x03'
console.log(s1)
const ret1 = parsers.parseHQES(s1)
console.log(ret1)

// HS

const s2 = `\x02030,1,1,1225,000,0,0,0,000,0,0,0\x03\r\n\x02001,0,0,1,1,2,6,0,00000100,1,000\x03\r\n\x021234,0\x03\r\n`
console.log(s2)
const ret2 = parsers.parseHS(s2)
console.log(ret2)

// HD

const s3 = `
Head Temp = 22
Ambient Temp = 153
Head Test = Test Not Run
Darkness Adjust = 10
Print Speed = 6.0
Slew Speed = 6.0
Backfeed Speed = 2.0
Static_pitch_length = 0420
Dynamic_pitch_length = 0000
Max_dynamic_pitch_length = 0000
Min_dynamic_pitch_length = 0000
COMMAND PFX = ~ : FORMAT PFX = ^ : DELIMITER = ,
Dynamic_top_position = 0000

No ribbon A/D = 0000

PCB Temp = 177
`
console.log(s3)
const ret3 = parsers.parseHD(s3)
console.log(ret3)
