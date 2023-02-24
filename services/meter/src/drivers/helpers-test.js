// run with 'node helpers-test.js'

import * as helpers from './helpers.js'

function test(actual, expected) {
  if (JSON.stringify(actual) == JSON.stringify(expected)) {
    console.log('pass')
  } else {
    console.log('fail', actual, expected)
  }
}

// --------------

console.log(
  'getTodayLocal - should be today',
  helpers.getTodayLocal('America/Chicago')
)

// --------------

test(
  helpers.getDate('2023-02-18', '10:00', 'America/Chicago'),
  new Date('2023-02-18T16:00:00Z')
)
test(
  helpers.getDate('2023-02-18', '3am', 'America/Chicago'),
  new Date('2023-02-18T09:00:00Z')
)
test(
  helpers.getDate('2023-02-18', null, 'America/Chicago'),
  new Date('2023-02-18T06:00:00Z')
)
test(
  helpers.getDate('2023-02-18T04:00', null, 'America/Chicago'),
  new Date('2023-02-18T10:00:00Z')
)

// --------------

// //. what's the pt of this fn?
// test(helpers.getDate('2023-02-18T02:00'), new Date('2023-02-18T08:00:00Z'))

// --------------

test(helpers.getDowntimes('2023-02-17', '10:00am,10\n 2pm, 10 '), [
  {
    start: new Date('2023-02-17T16:00:00Z'),
    stop: new Date('2023-02-17T16:10:00Z'),
  },
  {
    start: new Date('2023-02-17T20:00:00Z'),
    stop: new Date('2023-02-17T20:10:00Z'),
  },
])
test(helpers.getDowntimes('2023-02-17', '10:00amx,10\n2pm,10'), null)

// --------------

// note: we need leading zeros for
test(helpers.sanitizeTime('3pm'), '15:00')
test(helpers.sanitizeTime('9'), '09:00')
test(helpers.sanitizeTime('15:00:00'), '15:00')
test(helpers.sanitizeTime('12:15am'), '00:15')
test(helpers.sanitizeTime('12:15'), '12:15')
test(helpers.sanitizeTime('12:15pm'), '12:15')
test(helpers.sanitizeTime('13:15'), '13:15')
test(helpers.sanitizeTime('0'), '00:00')
test(helpers.sanitizeTime('1'), '01:00')
test(helpers.sanitizeTime('a'), null)

// --------------

// let now1 = new Date('2023-02-17T20:05:00Z')
// let now2 = new Date('2023-02-17T18:00:00Z')
// let schedule = {
//   start: new Date('2023-02-17T11:00:00Z'),
//   stop: new Date('2023-02-17T21:00:00Z'),
//   holiday: false,
//   downtimes: [
//     {
//       start: new Date('2023-02-17T16:00:00Z'),
//       stop: new Date('2023-02-17T16:10:00Z'),
//     },
//     {
//       start: new Date('2023-02-17T20:00:00Z'),
//       stop: new Date('2023-02-17T20:10:00Z'),
//     },
//   ],
// }
// test(helpers.getIsDuringShift(now1, schedule), false)
// test(helpers.getIsDuringShift(now2, schedule), true)
