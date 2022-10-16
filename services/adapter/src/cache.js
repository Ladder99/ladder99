// cache
// manages a set of key-item pairs.

// this is an intermediary between the raw device data and the shdr output.

// when a key-item value is set, the cache will perform any associated output
// calculations and send shdr output to attached tcp socket, IF value changed.

// see setupSource.js and helpers.js for code that sets up the reactive cache calculations.
//. bring that code in here

//. eg ___

export class Cache {
  //
  constructor() {
    this._map = new Map() // key-item pairs //. why not just {} ?
    this._mapKeyToOutputs = {} // list of outputs assoc with each key, //. eg ?
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
      console.log(
        `Cache addOutputs`,
        outputs.map(o => o.key)
      )
      for (const output of outputs) {
        // console.log(output.key, output.dependsOn)
        // output.socket = socket // attach tcp socket to each output also
        // add dependsOn eg ['ac1-power_fault', 'ac1-power_warning']
        for (const key of output.dependsOn) {
          if (this._mapKeyToOutputs[key]) {
            this._mapKeyToOutputs[key].push(output)
          } else {
            this._mapKeyToOutputs[key] = [output]
          }
        }
      }
    }
  }

  // attach tcp socket to each output, or clear if socket=null
  setSocket(outputs, socket) {
    // can ignore if no outputs
    if (outputs) {
      console.log(
        `Cache setSocket`,
        outputs.map(o => o.key)
      )
      if (socket) {
        console.log(`Cache send last known data values to agent...`)
      }
      for (const output of outputs || []) {
        output.socket = socket
        if (output.socket) {
          // send last known data value to agent
          const shdr = getShdr(output, output.lastValue || 'UNAVAILABLE')
          // console.log(`Cache - send ${shdr.slice(0, 60)}...`)
          try {
            output.socket.write(shdr + '\n')
          } catch (error) {
            console.log(error)
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
  //. instead of fixed code here for output, could have custom code - set other cache values, etc
  set(key, value, options = {}) {
    // if (!options.quiet) {
    // const s = typeof value === 'string' ? `"${value.slice(0, 99)}..."` : value
    // console.log(`Cache - set ${key}: ${s}`)
    // }
    // //. don't allow undefined as a value? not in vocabulary of mtc
    // if (value === undefined) return

    //. what if want to check if a value changed?
    //. eg if (this._map.get(key) !== value) { ... }

    // update the cache value
    this._map.set(key, value)
    // get list of outputs associated with this key
    // eg ['ac1-power_condition']
    const outputs = this._mapKeyToOutputs[key]
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
              console.log(`Cache value changed, send "${shdr.slice(0, 60)}..."`)
            }
            try {
              output.socket.write(shdr + '\n')
            } catch (error) {
              console.log(error)
            }
          } else {
            console.log(`Cache no socket to write to`)
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
    return this._map.get(key)
  }

  // check if cache has a key
  has(key) {
    return this._map.has(key)
  }

  // check if key has a shdr output associated with it
  hasOutput(key) {
    return this._mapKeyToOutputs[key] !== undefined
  }
}

// calculate value for the given cache output (can use other cache keyvalues)
function getValue(cache, output) {
  //. rename .value to .getValue or .valueFn
  const { value: valueFn } = output
  const value = valueFn(cache) // do calculation
  return value
}

// calculate SHDR using the given output object.
// cache is the Cache object.
// output has { key, category, type, representation, value, shdr, ... }.
// timestamp is an optional STRING that goes at the front of the shdr.
// can save some time/space by not including it.
// eg SHDR could be '|m1-avail|AVAILABLE'
function getShdr(output, value, timestamp = '') {
  if (typeof value === 'string') {
    value = sanitize(value)
  }
  const { key, category, type, subType, representation, nativeCode } = output
  let shdr = ''
  // handle different shdr types and representations
  // this first is the default representation, so don't require category to be defined in outputs.yaml
  if (category === 'EVENT' || category === 'SAMPLE' || category === undefined) {
    if (type === 'MESSAGE') {
      // The next special format is the Message. There is one additional field,
      // native_code, which needs to be included:
      // 2014-09-29T23:59:33.460470Z|message|CHG_INSRT|Change Inserts
      // From https://github.com/mtconnect/cppagent#adapter-agent-protocol-version-17 -
      shdr = `${timestamp}|${key}|${sanitize(nativeCode)}|${value}`
    } else {
      shdr = `${timestamp}|${key}|${value}`
    }
  } else if (category === 'CONDITION') {
    //. can have >1 value for a condition - how handle?
    //. see https://github.com/Ladder99/ladder99-ce/issues/130
    if (!value || value === 'UNAVAILABLE') {
      shdr = `${timestamp}|${key}|${value}||||${value}`
    } else {
      //. pick these values out of the value, which should be an object
      //. and sanitize them
      const level = value // eg 'WARNING' -> element 'Warning'
      const nativeCode = 'nativeCode'
      const nativeSeverity = 'nativeSeverity'
      const qualifier = 'qualifier'
      const message = value
      shdr = `${timestamp}|${key}|${level}|${nativeCode}|${nativeSeverity}|${qualifier}|${message}`
    }
  } else {
    console.warn(`Cache warning: unknown category '${category}'`)
  }
  return shdr
}

// sanitize a string by escaping or removing pipes.
// from cppagent readme -
// If the value itself contains a pipe character | the pipe must be escaped using a
// leading backslash \. In addition the entire value has to be wrapped in quotes:
//   2009-06-15T00:00:00.000000|description|"Text with \| (pipe) character."
function sanitize(str) {
  return str.replaceAll('|', '/') //. just convert pipes to a slash for now
}
