// cache
// manages a set of key-item pairs.

// this is an intermediary between the raw device data and the shdr output.

// when a key-item value is set, the cache will perform any associated output
// calculations and send shdr output to attached tcp socket, IF value changed.

export class Cache {
  //
  constructor() {
    this._map = new Map() // key-item pairs //. explain why not just {}
    this._mapKeyToOutputs = {} // list of outputs assoc with each key, //. eg
  }

  // addOutputs
  // each cache key can have multiple output calculations associated with it.
  // this builds a map from a key to a list of outputs.
  // each output goes to the same tcp socket.
  // called from adapter.js for each device source.
  // outputs is [{ key, category, type, representation, socket, dependsOn, value }, ...]
  // eg [{ key: 'ac1-power_condition', value: (fn), dependsOn: ['ac1-power_fault', 'ac1-power_warning'] }, ...]
  // so this builds a map from those dependsOn values to the output object.
  // eg { 'ac1-power_fault': [{ key:'ac1-power_condition', value: (fn), ...}], ... }
  // addOutputs(outputs, socket) {
  addOutputs(outputs) {
    console.log(`Cache - add ${outputs.length} outputs`)
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

  // attach tcp socket to each output, or clear if socket=null
  setSocket(outputs, socket) {
    console.log(`Cache - setSocket...`)
    if (socket) {
      console.log(`Cache - send last known data values to agent...`)
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

  // set a key-value pair in the cache.
  // eg set('ac1-power_warning', { quiet: true})
  // options is { timestamp, quiet }
  // timestamp is an optional STRING that is used in the SHDR
  //. explain distinction between value param and value variable below, with examples
  set(key, value, options = {}) {
    // if (!options.quiet) {
    //   const s = typeof value === 'string' ? `"${value.slice(0, 99)}..."` : value
    //   console.log(`Cache - set ${key}: ${s}`)
    // }
    // update the cache value
    this._map.set(key, value)
    // get list of outputs associated with this key
    // eg ['ac1-power_condition']
    const outputs = this._mapKeyToOutputs[key] || []
    // calculate outputs and send changed shdr values to tcp
    for (const output of outputs) {
      // calculate value of this cache output
      const value = getValue(this, output)
      // if value changed, send shdr to agent via tcp socket
      if (value !== output.lastValue) {
        output.lastValue = value
        if (output.socket) {
          const shdr = getShdr(output, value, options.timestamp) // timestamp can be ''
          if (!options.quiet) {
            console.log(`Cache - value changed, send "${shdr.slice(0, 60)}..."`)
          }
          try {
            output.socket.write(shdr + '\n')
          } catch (error) {
            console.log(error)
          }
        } else {
          console.log(`Cache - no socket to write to`)
        }
      }
    }
  }

  // get a value from cache
  // eg get('pr1-avail')
  get(key) {
    return this._map.get(key)
  }
}

// calculate value for the given cache output (can use other cache keyvalues)
function getValue(cache, output) {
  //. rename .value to .getValue or .valueFn
  const { value: getValue } = output
  const value = getValue(cache) // do calculation
  return value
}

// calculate SHDR using the given output object.
// cache is the Cache object.
// output has { key, category, type, representation, value, shdr, ... }.
// timestamp is an optional STRING that goes at the front of the shdr.
// can save some time/space by not including it.
// eg SHDR could be '|m1-avail|AVAILABLE'
function getShdr(output, value, timestamp = '') {
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
      shdr = `${timestamp}|${key}|${nativeCode}|${value}`
    } else {
      shdr = `${timestamp}|${key}|${value}`
    }
  } else if (category === 'CONDITION') {
    //. pick these values out of the value, which should be an object
    //. also, can have >1 value for a condition - how handle?
    //. see https://github.com/Ladder99/ladder99-ce/issues/130
    if (!value || value === 'UNAVAILABLE') {
      shdr = `${timestamp}|${key}|${value}||||${value}`
    } else {
      const level = value // eg 'WARNING' -> element 'Warning'
      const nativeCode = 'nativeCode'
      const nativeSeverity = 'nativeSeverity'
      const qualifier = 'qualifier'
      const message = value //. need to escape spaces and pipes - gets sent as CDATA in agent output, yes?
      shdr = `${timestamp}|${key}|${level}|${nativeCode}|${nativeSeverity}|${qualifier}|${message}`
    }
  } else {
    console.warn(`Cache warning: unknown category '${category}'`)
  }
  return shdr
}
