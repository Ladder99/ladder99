// test metric calcs

import * as metrics from './metrics.js'

// const dims = { year: 2021, dayOfYear: 1, hour: 0, minute: 0 }
// console.log(new Date(getHourInSeconds(dims) * 1000))

const valueDefs = {
  availability: {
    when: 'AVAILABLE',
    bin: 'time_available',
  },
}
const dimensionDefs = {
  minute: {},
}

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

const dimensions = {}
const currentBins = {}
const timers = {}

{
  // const accumulatorBins = metrics.getAccumulatorBins(
  //   observations,
  //   dimensions,
  //   timers
  // )
  // console.log()
  // console.log('DONE', 'accumulator bins')
  // console.log(accumulatorBins)
  // const sql = metrics.getSql(accumulatorBins)
  // console.log(sql)
}

//

// test getDeltas

import * as metrics2 from './metrics2.js'

{
  metrics.assignTimesToObservations(observations)
  // console.log(observations)

  // for (let observation of observations) {
  //   metrics2.handleObservation(
  //     observation,
  //     dimensions,
  //     accumulatorBins,
  //     currentBins,
  //     timers,
  //     valueDefs,
  //     dimensionDefs,
  //   )
  // }

  // console.log()

  const dimensionDeltas = metrics2.getDimensionDeltas(currentBins, dimensions)
  console.log(dimensionDeltas)

  // metrics2.clearCurrentBins(currentBins)
}
