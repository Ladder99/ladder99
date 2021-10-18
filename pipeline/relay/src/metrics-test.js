// test metric calcs

// import * as metrics from './metrics.js'
// import * as metrics from './metrics2.js'
import * as metrics from './metrics3.js'

// dimensionDefs
// if any one of these dimensions changes,
// start putting the time / count values in other bins.
// keyed on dataitem name, eg 'operator'.
//. move these into yaml, and have per client
//. might want these to be per device or device type also?
const dimensionDefs = {
  hour1970: {},
  // add these as needed, to be able to slice reports later
  operator: {},
  // machine: {},
  // component: {},
  // job: {},
  // operation: {},
}

// valueDefs
// dataitems that we want to track the state of.
// will track time the dataitem spends in the 'when' state,
// and add it to the given 'slot'.
// keyed on dataitem / observation name, ie NOT the dataitem id.
// so in the agent.xml, DO NOT include the deviceId in the names,
// just have a plain descriptor.
//. move these into yaml, and have per client
//. might want these to be per device or device type also
const valueDefs = {
  availability: {
    when: 'AVAILABLE',
    slot: 'time_available',
  },
  execution_state: {
    when: 'ACTIVE',
    slot: 'time_active',
  },
}

// const dims = { year: 2021, dayOfYear: 1, hour: 0, minute: 0 }
// console.log(new Date(metrics.getHourInSeconds(dims) * 1000))

// {
//   const date = new Date()
//   console.log(metrics.getHours1970(date))
// }

// simulated observations from 'sample' endpoint.
// time_available should be 20+10=30 secs
const observations = [
  {
    device_id: 1,
    id: 'kl1-oper',
    name: 'operator',
    timestamp: '2021-10-10T23:00:00Z',
    value: 'alice',
  },
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
  // {
  //   device_id: 1,
  //   id: 'kl1-avail',
  //   name: 'availability',
  //   timestamp: '2021-10-11T00:01:30Z',
  //   value: 'AVAILABLE',
  // },
  // {
  //   device_id: 1,
  //   id: 'kl1-avail',
  //   name: 'availability',
  //   timestamp: '2021-10-11T00:01:40Z',
  //   value: 'UNAVAILABLE',
  // },
]
// const currentBins = {}
// const dimensionsByDevice = {}
// const timersByDevice = {}

// metrics.amendObservations(observations)

// {
//   const accumulatorsByDevice = metrics.getAccumulatorsByDevice(
//     observations,
//     dimensionsByDevice,
//     timersByDevice
//   )
//   console.log()
//   console.log('DONE')
//   console.log(observations[0])
//   console.log('accumulator bins by device_id')
//   console.log(accumulatorsByDevice)
//   // const sql = metrics.getSql(accumulators)
//   // console.log('sql', sql)
// }

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

// {
//   const observation = observations[0]
//   const dimensions = dimensionsByDevice[observation.device_id] || {}
//   console.log(dimensions)
//   const dd = metrics.getDimensionDeltas(currentBins, dimensions)
//   console.log(dd)
// }

// {
//   const dimensionKey = metrics.getDimensionKey(observations[0])
//   console.log(dimensionKey)
// }

// {
//   const bins = new metrics.Bins()
//   bins.setDimensionValue(1, 'operator', 'alice')
//   console.log(bins)
//   bins.addObservation({ device_id: 1, slot: 'time_available' }, 10)
//   bins.setDimensionValue(1, 'operator', 'bob')
//   bins.addObservation({ device_id: 1, slot: 'time_available' }, 20)
//   bins.addObservation({ device_id: 1, slot: 'time_available' }, 30)
//   bins.setDimensionValue(2, 'operator', 'kramer')
//   bins.addObservation({ device_id: 2, slot: 'time_available' }, 20)
//   console.log(bins.data)
// }

// process.exit(1)

;(async function () {
  const tracker = new metrics.Tracker(null, dimensionDefs, valueDefs)
  console.log(tracker)
  tracker.startTimer(2000) // start timer which dumps bins to db every interval
  while (true) {
    tracker.trackObservations(observations) // update bins
    await new Promise(resolve => setTimeout(resolve, 1000)) // pause
  }
})()
