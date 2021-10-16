// test metric calcs

import * as metrics from './metrics.js'

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

const dimensions = {}
const currentBins = {}
const timers = {}

const accumulatorBins = metrics.getAccumulatorBins(
  observations,
  dimensions,
  timers
)

console.log()
console.log('DONE', 'accumulator bins')
console.log(accumulatorBins)

// const sql = metrics.getSql(accumulatorBins)
// console.log(sql)

//

// test getDeltas

import * as metrics2 from './metrics2.js'

metrics.assignTimesToObservations(observations)
// console.log(observations)

const valueDefs = {
  availability: {
    when: 'AVAILABLE',
    bin: 'time_available',
  },
}
const dimensionDefs = {
  minute: {},
}

for (let observation of observations) {
  // get time deltas for value changes
  const valueDeltas = metrics2.getValueDeltas(observation, timers, valueDefs)
  console.log(valueDeltas)

  // apply deltas to currentBins
  for (let bin of Object.keys(valueDeltas)) {
    const delta = valueDeltas[bin]
    if (currentBins[bin] === undefined) {
      currentBins[bin] = delta
    } else {
      currentBins[bin] += delta
    }
  }

  // get time deltas for dimension changes
  const dimensionDeltas = metrics2.getDimensionDeltas(
    observation,
    dimensions,
    accumulatorBins,
    currentBins,
    dimensionDefs
  )
  console.log(dimensionDeltas)

  //. apply time deltas to accumulator bins, clear currentBins
  //. if time=minutechange then dump accum bins to db, clear them ?
}
// console.log(currentBins)

//

console.log()

const foo = metrics2.getDeltas(currentBins, dimensions, 'minute', 0)
console.log(foo)
