// test metric calcs

import { getMetrics, getSql } from './metrics.js'

const observations = [
  {
    name: 'availability',
    timestamp: '2021-10-11T00:00:00Z',
    value: 'UNAVAILABLE',
  },
  {
    timestamp: '2021-10-11T00:00:10Z',
    name: 'availability',
    value: 'AVAILABLE',
  },
  {
    timestamp: '2021-10-11T00:00:30Z',
    name: 'availability',
    value: 'UNAVAILABLE',
  },
  // {
  //   timestamp: '2021-10-11T00:00:50Z',
  //   name: 'availability',
  //   value: 'AVAILABLE',
  // },
]

//. will want availableTime to be 20sec

const currentDimensionValues = {}
const startTimes = {}

const accumulatorBins = getMetrics(
  currentDimensionValues,
  startTimes,
  observations
)

// console.log()
// console.log('DONE', 'accumulator bins')
// console.log(accumulatorBins)

const sql = getSql(accumulatorBins)
console.log(sql)
