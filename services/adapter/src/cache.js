// cache
// manage a set of key-item pairs.
// where key is a string, and item is an object with { value, timestamp, shdr, ... }.

// this is an intermediary between the raw device data and the shdr output.

// when a key-item value is set, the cache will perform any associated output
// calculations and send shdr output to attached tcp socket, IF the value changed.

// see setupSource.js and helpers.js for code that sets up the reactive cache calculations.
//. bring relevant code in here

import * as lib from './common/lib.js'
import { getShdr } from './drivers/egress/shdr.js'

export class Cache {
  //
  constructor() {
    // key-item pairs
    this.map = {}

    // list of outputs associated with each key
    // eg { 'm1-power_fault': [{ key:'m1-power_condition', value: (fn), ...}], ... }
    this.mapKeyToOutputs = {}
  }

  // addOutputs
  // each cache key can have multiple output calculations associated with it.
  // this builds a map from a key to a list of outputs.
  // each output goes to the same tcp socket.
  // called for each device source.
  // outputs is [{ key, category, type, representation, socket, dependsOn, value }, ...]
  // eg [{ key: 'ac1-power_condition', value: (fn), dependsOn: ['ac1-power_fault', 'ac1-power_warning'] }, ...]
  // so this builds a map from those dependsOn values to the output object.
  // eg { 'ac1-power_fault': [{ key:'ac1-power_condition', value: (fn), ...}], ... }
  addOutputs(outputs) {
    if (outputs) {
      const outputKeys = outputs.map(o => o.key).join(',') // just for logging
      console.log(`Cache addOutputs`, outputKeys)
      for (const output of outputs) {
        // add output to map, eg ['ac1-power_fault', 'ac1-power_warning']
        for (const key of output.dependsOn) {
          this.mapKeyToOutputs[key] = this.mapKeyToOutputs[key] || []
          this.mapKeyToOutputs[key].push(output)
        }
      }
    }
  }

  // attach tcp socket to each output, or clear if socket=null
  setSocket(outputs, socket) {
    // can ignore if no outputs
    if (outputs) {
      const outputKeys = outputs.map(o => o.key).join(',')
      console.log(`Cache setSocket`, outputKeys)
      if (socket) {
        console.log(`Cache send last known data values to agent...`)
      }
      for (const output of outputs || []) {
        output.socket = socket
        if (output.socket) {
          // send last known data value to agent

          // //. send unavailable if no value saved yet?
          // // const shdr = getShdr(output, output.lastValue || 'UNAVAILABLE')
          // const shdr = getShdr(output, output.lastValue ?? 'UNAVAILABLE')
          // console.log(`Cache send "${lib.truncate(shdr)}"`)
          // try {
          //   output.socket.write(shdr + '\n')
          // } catch (error) {
          //   console.log(error)
          // }

          //. only send shdr if lastValue exists?
          // i think this makes more sense.
          // next time the value is updated, it'll send the shdr.
          if (output.lastValue !== undefined) {
            const shdr = getShdr(output, output.lastValue)
            console.log(`Cache send "${lib.truncate(shdr)}"`)
            try {
              output.socket.write(shdr + '\n')
            } catch (error) {
              console.log(error)
            }
          }
        }
      }
    }
  }

  // set a key-value pair in the cache.
  // eg set('ac1-power_warning', { quiet: true})
  // options is { timestamp, quiet }
  // timestamp is an optional STRING that is used in the SHDR
  //. explain distinction between value param and value variable below, with examples
  //. instead of fixed code here for output, could have custom code -
  // set other cache values, send partcount reset commands, etc.
  // ie you could attach multiple handlers to a cache key.
  set(key, value, options = {}) {
    // if (!options.quiet) {
    // const s = typeof value === 'string' ? `"${value.slice(0, 99)}..."` : value
    // console.log(`Cache - set ${key}: ${s}`)
    // }

    // //. don't allow undefined as a value? not in vocabulary of mtc. translate to UNAVAILABLE?
    // if (value === undefined) return

    //. what if want to check if a value changed?
    //. eg if (this.map[key] !== value) { ... }

    // update the cache value
    this.map[key] = value

    // get list of outputs associated with this key, eg ['ac1-power_condition']
    const outputs = this.mapKeyToOutputs[key]
    if (outputs && outputs.length > 0) {
      // calculate outputs and send changed shdr values to tcp
      for (const output of outputs) {
        // calculate value of this cache output
        //. confusing to have two 'value' variables!
        const value = getValue(this, output)
        // if value changed, send shdr to agent via tcp socket
        if (value !== output.lastValue) {
          output.lastValue = value
          if (output.socket) {
            const shdr = getShdr(output, value, options.timestamp) // timestamp can be ''
            if (!options.quiet) {
              console.log(`Cache value changed, send "${lib.truncate(shdr)}"`)
            }
            try {
              output.socket.write(shdr + '\n')
            } catch (error) {
              console.log(error)
            }
          } else {
            console.log(
              `Cache value changed, but no socket to write to yet - saved for later.`
            )
          }
        }
      }
    } else {
      console.log(`Cache warning no outputs for key ${key}`)
    }
  }

  // get a value from cache
  // eg get('pr1-avail')
  get(key) {
    return this.map[key]
  }

  // check if cache has a key
  has(key) {
    return this.map[key] !== undefined
  }

  // check if key has a shdr output associated with it
  hasOutput(key) {
    return this.mapKeyToOutputs[key] !== undefined
  }
}

// helper fns

// calculate value for the given cache output (can use other cache keyvalues)
function getValue(cache, output) {
  //. rename output.value to .getValue or .valueFn or .code or .calc
  const { value: valueFn } = output
  const value = valueFn(cache) // do calculation
  return value
}
