// test metric calcs

import { updateMetrics } from './metrics.js'

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
]

const db = null
const currentDimensionValues = {}
const startTimes = {}

const accumulatorBins = updateMetrics(
  currentDimensionValues,
  startTimes,
  observations
)
console.log(accumulatorBins)
