// test metric calcs

// import * as metrics from './metrics.js'
import * as metrics from './metrics2.js'
// import * as metrics from './metrics3.js'

// const dims = { year: 2021, dayOfYear: 1, hour: 0, minute: 0 }
// console.log(new Date(metrics.getHourInSeconds(dims) * 1000))

// simulated observations from 'sample' endpoint.
// time_available should be 20+10=30 secs
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

const dimensions = {}
const bins = {}
const timers = {}

// {
// metrics.amendObservations(observations)
// }

{
  const accumulators = metrics.getAccumulatorsByDevice(
    observations,
    dimensions,
    timers
  )
  console.log()
  console.log('DONE', 'accumulator bins')
  console.log(accumulators)
  // const sql = metrics.getSql(accumulators)
  // console.log('sql', sql)
}

//

// test getDeltas

// {
//   metrics.assignTimesToObservations(observations)
//   // console.log(observations)

//   // for (let observation of observations) {
//   //   metrics.handleObservation(
//   //     observation,
//   //     dimensions,
//   //     accumulators,
//   //     bins,
//   //     timers,
//   //     valueDefs,
//   //     dimensionDefs,
//   //   )
//   // }

//   // console.log()

//   const dimensionDeltas = metrics.getDimensionDeltas(bins, dimensions)
//   console.log(dimensionDeltas)

//   // metrics.clearCurrentBins(bins)
// }
