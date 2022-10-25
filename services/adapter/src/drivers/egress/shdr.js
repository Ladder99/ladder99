// shdr egress driver

//. slowly moving old code to an egress driver, then to a streaming driver

// calculate SHDR using the given output object.
// cache is the Cache object.
// output has { key, category, type, representation, value, shdr, ... }.
// timestamp is an optional ISO datetime STRING that goes at the front of the shdr.
// can save some time/space by not including it.
// eg SHDR could be '|m1-avail|AVAILABLE'
//. bring in DATA_SET handler and sanitizer from drivers/micro.js
export function getShdr(output, value, timestamp = '') {
  if (typeof value === 'string') {
    value = sanitize(value)
  }
  const { key, category, type, subType, representation, nativeCode } = output
  let shdr = ''
  // handle different shdr types and representations
  // this first is the default representation, so don't require category to be defined in outputs.yaml
  if (category === 'EVENT' || category === 'SAMPLE' || category === undefined) {
    if (type === 'MESSAGE') {
      // From https://github.com/mtconnect/cppagent#adapter-agent-protocol-version-17
      //   The next special format is the Message. There is one additional field,
      //   native_code, which needs to be included, eg:
      //   2014-09-29T23:59:33.460470Z|message|CHG_INSRT|Change Inserts
      shdr = `${timestamp}|${key}|${sanitize(nativeCode)}|${value}`
    } else {
      shdr = `${timestamp}|${key}|${value}`
    }
  } else if (category === 'CONDITION') {
    //. can have >1 value for a condition - how handle?
    //. see https://github.com/Ladder99/ladder99/issues/130
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

// helpers

// sanitize a string by escaping or removing pipes.
// from cppagent readme -
//   If the value itself contains a pipe character | the pipe must be escaped using a
//   leading backslash \. In addition the entire value has to be wrapped in quotes:
//   2009-06-15T00:00:00.000000|description|"Text with \| (pipe) character."
function sanitize(str) {
  return str.replaceAll('|', '/') //. just convert pipes to a slash for now
}
