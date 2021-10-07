// Observations
// read current and sample endpoints and write data to db
// called from agentReader

import { Data } from './data.js'
import * as treeObservations from './treeObservations.js'

//. move these into yaml
// dimensionDefs - keyed on dataitem/observation name
// if any one of these changes, start putting the time/count values in other bins
const dimensionDefs = {
  hour: {}, //. okay? what if some need higher resolution? eg minute?
  operator: {},
  machine: {},
  component: {},
  job: {},
  operation: {},
}
// valueDefs - keyed on dataitem/observation name
const valueDefs = {
  availability: {
    bin: 'timeAvailable',
    when: 'AVAILABLE',
  },
  execution: {
    bin: 'timeActive',
    when: 'ACTIVE',
  },
}

export class Observations extends Data {
  constructor(type) {
    super()
    this.type = type // used by read method
    // this.bins = {} // bins for calculate method
    // this.previousTime = null
  }

  async read() {
    await super.read(...arguments) // see base class in data.js

    // get flat list of observations from xml tree
    // observations is [{ tag, dataItemId, name, timestamp, value }, ...]
    this.observations = treeObservations.getElements(this.json)
  }

  // write values to db
  async write(db, indexes) {
    // build up an array of history records to write
    // see https://stackoverflow.com/a/63167970/243392
    const records = []
    for (let obs of this.observations) {
      const node = indexes.objById[obs.dataItemId]
      if (node) {
        // const { device_id, property_id } = node
        const { device_id, dataitem_id } = node
        // obs.value is always string, due to the way the xml is stored, like <value>10</value>
        //. better to use dataitem category to convert to number?
        //  ie SAMPLES are numeric, EVENTS are strings
        //. keep in mind that conditions can have >1 value also
        const value = Number(obs.value) || JSON.stringify(obs.value)
        const record = {
          node_id: device_id,
          // property_id,
          dataitem_id,
          time: obs.timestamp,
          value,
        }
        records.push(record)
      } else {
        console.log(`Warning: objById index missing dataItem ${obs.dataItemId}`)
      }
    }

    // write all records to db
    return await db.addHistory(records)

    // this.from = nextSequence
  }

  // do calculations on values and write to db - bins table
  // db is database object
  // indexes is dict of indexes referring to probe dataitems
  // currentDimensionValues is dict with current dimension values, eg { operator: 'Alice' }
  // startTimes is dict with start times for each bin, eg { availability: 18574734.321 }
  async calculate(db, indexes, currentDimensionValues, startTimes) {
    //
    // convert iso timestamps to seconds since 1970-01-01
    this.observations.forEach(observation => {
      // observation.timestampDateObj = new Date(observation.timestamp)
      const date = new Date(observation.timestamp)
      observation.timestampSecs = date.getTime() * 0.001
      observation.hour = date.getHours() // 0-23
      observation.dayOfYear = getDayOfYear(date) // 1-366
      //. etc - like this eventually
      // observation.slices = {
      //   hour: date.getHours(), // 0-23
      //   minute: date.getMinutes(), // 0-59
      // }
    })

    // sort observations by timestamp asc, for correct state machine transitions.
    // because sequence nums could be out of order, depending on network.
    this.observations.sort((a, b) => a.timestampSecs - b.timestampSecs)

    // accumulated bins for this calculation run - will add to db at end.
    // this is a dict of dicts - keyed on dimensions (glommed together), then bin name.
    const accumulatorBins = {}

    // bins for the current set of dimension values.
    // added to accumulator and cleared on each change of a dimension value.
    // keyed on bin name.
    const currentBins = {}

    // could have multiple observations of the same dataitem -
    // so need to run each observation through the state machine in order.
    for (let observation of this.observations) {
      if (!observation.name) continue // skip observations without data names

      //. for now, name includes machineId/ - remove it to get dataname, eg 'availability'
      const dataname = observation.name.slice(observation.name.indexOf('/') + 1)

      // value is eg 'Alice' for operator, 'ACTIVE' for execution, etc
      const { timestampSecs, dayOfYear, hour, value } = observation

      // dayOfYear is another dimension we need to track
      if (dayOfYear !== currentDimensionValues.dayOfYear) {
        dimensionValueChanged(
          accumulatorBins,
          currentBins,
          currentDimensionValues,
          'dayOfYear',
          dayOfYear
        )
      }

      // hour is another dimension we need to track
      if (hour !== currentDimensionValues.hour) {
        dimensionValueChanged(
          accumulatorBins,
          currentBins,
          currentDimensionValues,
          'hour',
          hour
        )
      }

      // check if this dataitem is a dimension we need to track, eg dataname='operator'
      if (dimensionDefs[dataname]) {
        //
        // if value of a dimension changes, dump current bins to accumulator bins
        // and update current value.
        if (value !== currentDimensionValues[dataname]) {
          dimensionValueChanged(
            accumulatorBins,
            currentBins,
            currentDimensionValues,
            dataname,
            value
          )
        }
        //
        // otherwise, if observation is something we need to track the lifespan of,
        // update start time or current bin.
      } else if (valueDefs[dataname]) {
        const valueDef = valueDefs[dataname] // eg { bin: 'timeActive', when: 'ACTIVE' }
        const bin = valueDef.bin // eg 'timeActive'
        // handle edge transition - start or stop timetracking for the value.
        // eg valueDef.when could be 'AVAILABLE' or 'ACTIVE' etc.
        if (value === valueDef.when) {
          // start 'timer' for this observation
          // add guard in case agent is defective and sends these out every time, instead of just at start
          if (!startTimes[dataname]) {
            startTimes[dataname] = timestampSecs
          }
        } else {
          // otherwise, observation is turning 'off' - dump the time to the current bin
          if (startTimes[dataname]) {
            const delta = timestampSecs - startTimes[dataname] // sec
            console.log('turning off:', dataname, 'delta:', delta)
            if (currentBins[bin] === undefined) {
              currentBins[bin] = delta
            } else {
              currentBins[bin] += delta
            }
            startTimes[dataname] = null
          }
        }
      }
    }

    console.log('currentDimensionValues', currentDimensionValues)
    console.log('startTimes', startTimes)
    console.log('currentBins', currentBins)

    // const currentTime = new Date().getTime()
    // accumulatorBins.timeCalendar = (currentTime - previousTime) * 0.001 // sec
    // previousTime = currentTime

    //. dump accumulator bins to db
    //. write to cache, which will write to db
    // cache.set(cacheKey, { value: bins[key] }) // sec
    //. just print for now
    // eg { '{"operator":"Alice"}': { timeActive: 1 } }
    console.log('accumulatorBins', accumulatorBins)

    //. write to db
    const keys = Object.keys(accumulatorBins)
    for (let key of keys) {
      const dims = splitDimensionKey(key) // eg { operator: 'Alice' }
      const acc = accumulatorBins[key] // eg { timeActive: 1 }
      console.log('add to', dims, 'vals', acc)
    }
    // const sql = ``
    // db.write(sql)
    console.log()
  }

  //   // get sequence info from header
  //   // const header = json.MTConnectStreams.Header
  //   const header = data.getHeader()
  //   const { firstSequence, nextSequence, lastSequence } = header
  //   this.from = nextSequence
  //   const dataItems = data.getDataItems()
  //   await this.writeDataItems(dataItems)
  //   // //. if gap, fetch and write that also
  //   // const gap = false
  //   // if (gap) {
  //   //   const json = await fetchAgentData('sample', sequences.from, sequences.count)
  //   //   const dataItems = getDataItems(json)
  //   //   await writeDataItems(db, dataItems)
  //   // }
  // }
  // // gather up all items into array, then put all into one INSERT stmt, for speed.
  // // otherwise pipeline couldn't keep up.
  // // see https://stackoverflow.com/a/63167970/243392 etc
  // async writeDataItems(dataItems) {
  //   //. write to db with arrays - that will translate to sql
  //   let rows = []
  //   for (const dataItem of dataItems) {
  //     let { dataItemId, timestamp, value } = dataItem
  //     const id = dataItemId
  //     const _id = this.idMap[id]
  //     if (_id) {
  //       value = value === undefined ? 'undefined' : value
  //       if (typeof value !== 'object') {
  //         const type = typeof value === 'string' ? 'text' : 'float'
  //         const row = `('${_id}', '${timestamp}', to_jsonb('${value}'::${type}))`
  //         rows.push(row)
  //       } else {
  //         //. handle arrays
  //         console.log(`**Handle arrays for '${id}'.`)
  //       }
  //     } else {
  //       console.log(`Unknown element id '${id}', value '${value}'.`)
  //     }
  //   }
  //   if (rows.length > 0) {
  //     const values = rows.join(',\n')
  //     const sql = `INSERT INTO history (_id, time, value) VALUES ${values};`
  //     console.log(sql)
  //     //. add try catch block - ignore error? or just print it?
  //     await this.db.query(sql)
  //   }
  // }
  //   async fetchSample() {
  //     this.from = null
  //     this.count = this.fetchCount
  //     let data
  //     let errors
  //     do {
  //       const json = await this.endpoint.fetchData(
  //         'sample',
  //         this.from,
  //         this.count
  //       )
  //       data = new Data(json)
  //       // check for errors
  //       // eg <Error errorCode="OUT_OF_RANGE">'from' must be greater than 647331</Error>
  //       // if (json.MTConnectError) {
  //       errors = data.getErrors()
  //       if (errors) {
  //         console.log(data)
  //         const codes = errors.map(e => e.Error.errorCode)
  //         if (codes.includes('OUT_OF_RANGE')) {
  //           // we lost some data, so reset the index and get from start of buffer
  //           console.log(
  //             `Out of range error - some data was lost. Will reset index and get as much as possible from start of buffer.`
  //           )
  //           this.from = null
  //           //. adjust fetch count/speed
  //         }
  //       }
  //     } while (errors)
  //     return data
  //   }
}

// a dimension value changed - dump current bins into accumulator bins,
// and update current dimension value
function dimensionValueChanged(
  accumulatorBins,
  currentBins,
  currentDimensionValues,
  dataname,
  value
) {
  console.log('dimensionValueChanged', dataname, value)
  // const dimensionDef = dimensionDefs[dataname]
  //
  // get key for this row, like 'hour=8,operator=Alice'
  const dimensionKey = getDimensionKey(currentDimensionValues)
  console.log('dimensionKey', dimensionKey)
  // start new dict if needed
  if (accumulatorBins[dimensionKey] === undefined) {
    accumulatorBins[dimensionKey] = {}
  }
  // dump current bins to accumulator bins, then clear them.
  // do this so can dump all accumulator bins to db in one go, at end.
  const acc = accumulatorBins[dimensionKey]
  for (let bin of Object.keys(currentBins)) {
    if (acc[bin] === undefined) {
      acc[bin] = currentBins[bin]
    } else {
      acc[bin] += currentBins[bin]
    }
    delete currentBins[bin]
  }
  console.log('accbins[dimkey]', acc)
  // update current dimension value
  currentDimensionValues[dataname] = value
}

function getDimensionKey(currentDimensionValues) {
  // const dimensionKey = Object.entries(currentDimensionValues)
  //   .map(([key, value]) => `${key}=${value}`)
  //   .join(',')
  // return dimensionKey
  return JSON.stringify(currentDimensionValues)
}

function splitDimensionKey(dimensionKey) {
  // const parts = dimensionKey.split(',')
  // const pairs = parts.map(part => part.split('='))
  // return pairs
  return JSON.parse(dimensionKey)
}

function getDayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 0)
  const diff =
    date.getTime() -
    start.getTime() +
    (start.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000
  const oneDay = 60 * 60 * 24 * 1000
  const day = Math.floor(diff / oneDay)
  return day
}
