// test metric calcs

import { getAccumulatorBins, getSql, getHourInSeconds } from './metrics.js'

// const dims = { year: 2021, dayOfYear: 1, hour: 0, minute: 0 }
// console.log(new Date(getHourInSeconds(dims) * 1000))

// simulated observations from 'sample' endpoint.
// time_available should be 20sec.
const observations = [
  {
    device_id: 1,
    id: 'kl1-avail',
    name: 'availability',
    timestamp: '2021-10-11T00:00:00Z',
    value: 'UNAVAILABLE',
  },
  {
    device_id: 1,
    id: 'kl1-avail',
    name: 'availability',
    timestamp: '2021-10-11T00:00:10Z',
    value: 'AVAILABLE',
  },
  {
    device_id: 1,
    id: 'kl1-avail',
    name: 'availability',
    timestamp: '2021-10-11T00:00:30Z',
    value: 'UNAVAILABLE',
  },
  {
    device_id: 1,
    id: 'kl1-avail',
    name: 'availability',
    timestamp: '2021-10-11T00:01:30Z',
    value: 'AVAILABLE',
  },
  {
    device_id: 1,
    id: 'kl1-avail',
    name: 'availability',
    timestamp: '2021-10-11T00:01:40Z',
    value: 'UNAVAILABLE',
  },
]

const currentDimensions = {}
const startTimes = {}

const accumulatorBins = getAccumulatorBins(
  observations,
  currentDimensions,
  startTimes
)

console.log()
console.log('DONE', 'accumulator bins')
console.log(accumulatorBins)

const sql = getSql(accumulatorBins)
console.log(sql)
