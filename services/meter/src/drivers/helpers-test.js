import * as helpers from './helpers.js'

// ----------

test(helpers.sanitizeTime('3pm'), '15:00')
test(helpers.sanitizeTime('9'), '9:00')
test(helpers.sanitizeTime('15:00:00'), '15:00')
test(helpers.sanitizeTime('12:15am'), '0:15')
test(helpers.sanitizeTime('12:15'), '12:15')
test(helpers.sanitizeTime('12:15pm'), '12:15')
test(helpers.sanitizeTime('13:15'), '13:15')
test(helpers.sanitizeTime('0'), '0:00')
test(helpers.sanitizeTime('1'), '1:00')
test(helpers.sanitizeTime('a'), null)

test(helpers.getTodayLocal(), '2023-02-17')

test(helpers.getDowntimes('10:00am,10\n2:00pm,10'), [
  {
    start: new Date('2023-02-17T16:00:00Z'),
    stop: new Date('2023-02-17T16:10:00Z'),
  },
  {
    start: new Date('2023-02-17T20:00:00Z'),
    stop: new Date('2023-02-17T20:10:00Z'),
  },
])

function test(actual, expected) {
  if (JSON.stringify(actual) == JSON.stringify(expected)) {
    console.log('pass')
  } else {
    console.log('fail', actual, expected)
  }
}
