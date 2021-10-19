export class Bins {
  constructor() {
    this.data = {} // per device_id, then dimensionKey, then slot
    this.dimensionKeys = {} // per device_id
  }

  // add an observation amount to a slot
  addObservation(observation, delta) {
    // note: already looked up slot in amendObservations
    const { device_id, slot } = observation
    const dimensionKey = this.getDimensionKey(device_id)
    const existingValue = this._getSlot(device_id, dimensionKey, slot)
    if (existingValue === undefined) {
      // create new bin with delta
      this._setSlot(device_id, dimensionKey, slot, delta)
    } else {
      // add delta to existing bin
      this._setSlot(device_id, dimensionKey, slot, existingValue + delta)
    }
  }

  // neither object or Map let you use an object/array as key where
  // you can retrieve a value with another object/array constructed similarly -
  // it must be the exact same object/array. so do this...

  _getSlot(key1, key2, key3) {
    const value1 = this.data[key1]
    if (value1 !== undefined) {
      const value2 = value1[key2]
      if (value2 !== undefined) {
        return value2[key3]
      }
    }
  }

  _setSlot(key1, key2, key3, value) {
    const value1 = this.data[key1]
    if (value1 !== undefined) {
      const value2 = value1[key2]
      if (value2 !== undefined) {
        value2[key3] = value
      } else {
        value1[key2] = { [key3]: value }
      }
    } else {
      this.data[key1] = { [key2]: { [key3]: value } }
    }
  }

  // clear data for one device
  clearDeviceData(device_id) {
    delete this.data[device_id]
  }

  // set one axis of the dimension key for a particular device
  setDimensionValue(device_id, key, value) {
    const keyvalues = this.dimensionKeys[device_id]
    if (keyvalues !== undefined) {
      keyvalues[key] = value
    } else {
      this.dimensionKeys[device_id] = { [key]: value }
    }
  }
  // get the dimension key for a device, eg '{"operator":"alice"}'
  getDimensionKey(device_id) {
    return JSON.stringify(this.dimensionKeys[device_id] || {})
  }

  // get sql statements to write given device_id data to db.
  // this.data is like { device_id: bins }
  //   with bins like { dimensions: accumulators }
  //   dimensions are like '{"operator":"Alice"}'
  //   with accumulators like { time_active: 1, time_available: 2 }}
  // getSql(accumulatorBins) {
  getSql(device_id) {
    let sql = ''
    // sql += JSON.stringify(this.data[device_id])
    //
    // bins is a dict like { dimensions: accumulators }
    // for (let [device_id, bins] of Object.entries(accumulatorBins)) {
    const bins = this.data[device_id]
    //
    // iterate over dimensions+accumulators
    // dimensions is eg '{"operator":"Alice", ...}' - ie gloms dimensions+values together
    // accumulators is eg { time_active: 1, time_available: 2, ... },
    //   ie all the accumulator slots and their time values in seconds.
    for (let [dimensions, accumulators] of Object.entries(bins)) {
      //
      const accumulatorSlots = Object.keys(accumulators) // eg ['time_active', 'time_available']
      if (accumulatorSlots.length === 0) continue // skip if no data

      // split dimensions into dimensions+values and get associated time.
      // const dims = splitDimensionKey(dimensions) // eg to {operator: 'Alice'}
      const dims = JSON.parse(dimensions) // eg to {operator: 'Alice'}
      // const seconds1970 = getHourInSeconds(dims) // rounded to hour, in seconds
      // if (!seconds1970) continue // skip if got NaN or something
      const seconds1970 = 12345678 //..
      const timestring = new Date(seconds1970 * 1000).toISOString() // eg '2021-10-15T11:00:00Z"

      // iterate over accumulator slots, eg 'time_active', 'time_available'.
      for (let accumulatorSlot of accumulatorSlots) {
        // get total time accumulated for the slot
        const timeDelta = accumulators[accumulatorSlot]
        if (timeDelta > 0) {
          // add values one at a time to existing db records.
          // would be better to do all with one stmt somehow,
          // but it's already complex enough.
          // this is an upsert command pattern in postgres -
          // try to add a new record - if key is already there,
          // update existing record by adding timeDelta to the value.
          sql += `
    INSERT INTO bins (device_id, time, dimensions, values)
      VALUES (${device_id}, '${timestring}',
        '${dimensions}'::jsonb,
        '{"${accumulatorSlot}":${timeDelta}}'::jsonb)
    ON CONFLICT (device_id, time, dimensions) DO
      UPDATE SET
        values = bins.values ||
          jsonb_build_object('${accumulatorSlot}',
            (coalesce((bins.values->>'${accumulatorSlot}')::real, 0.0::real) + ${timeDelta}));
      `
        }
      }
    }
    return sql
  }
}
