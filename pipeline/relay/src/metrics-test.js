import { updateMetrics, handleObservation } from './metrics.js'

const db = null
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
const currentDimensionValues = {}
const startTimes = { availability: 0 }
const accumulatorBins = {}
const currentBins = {}

// for (let obs of observations) {
//   handleObservation(
//     obs,
//     currentDimensionValues,
//     accumulatorBins,
//     currentBins,
//     startTimes
//   )
// }

updateMetrics(db, currentDimensionValues, startTimes, observations)
