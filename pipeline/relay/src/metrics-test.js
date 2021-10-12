// test metric calcs

import { getMetrics, getSql } from './metrics.js'

// simulated observations from 'sample' endpoint.
// time_available should be 20sec.
const observations = [
  {
    id: 'kl1-avail',
    name: 'availability',
    timestamp: '2021-10-11T00:00:00Z',
    value: 'UNAVAILABLE',
  },
  {
    id: 'kl1-avail',
    name: 'availability',
    timestamp: '2021-10-11T00:00:10Z',
    value: 'AVAILABLE',
  },
  {
    id: 'kl1-avail',
    name: 'availability',
    timestamp: '2021-10-11T00:00:30Z',
    value: 'UNAVAILABLE',
  },
]

const currentDimensionValues = {}
const startTimes = {}

const accumulatorBins = getMetrics(
  observations,
  currentDimensionValues,
  startTimes
)

// console.log()
// console.log('DONE', 'accumulator bins')
// console.log(accumulatorBins)

const sql = getSql(accumulatorBins)
console.log(sql)
