// adapter plugin code
// derived from models/ccs-pa and setups/demo/devices/CCS123.yaml etc

//. this is experimental for development

// mqtt topics
const topics = {
  sendQuery: 'l99/${serialNumber}/cmd/query',
  receiveQuery: 'l99/${serialNumber}/evt/query',
  receiveStatus: 'l99/${serialNumber}/evt/status',
  receiveRead: 'l99/${serialNumber}/evt/read',
}

// map from aliases to items, e.g. "CCS123-IN10" -> { address: "%I0.9", ... }
const aliases = {}

// initialize the client plugin.
// queries the device for address space definitions, subscribes to topics.
export function init(mqtt, cache, serialNumber, outputSocket) {
  console.log('init', { serialNumber })

  // add serialNumber to topics
  for (const key of Object.keys(topics)) {
    topics[key] = topics[key].replace('${serialNumber}', serialNumber)
  }
  console.log('MQTT topics', { topics })

  mqtt.on('message', onMessage)

  // ask for initial query message
  mqtt.subscribe(topics.receiveQuery)
  mqtt.publish(topics.sendQuery, '{}')

  // handle all incoming messages
  function onMessage(topic, buffer) {
    console.log('MQTT onMessage', { topic })
    const msg = unpack(topic, buffer)
    const handlers = {
      [topics.receiveQuery]: onQueryMessage,
      [topics.receiveStatus]: onStatusMessage,
      [topics.receiveRead]: onReadMessage,
    }
    const handler = handlers[topic]
    if (handler) {
      handler(msg)
    } else {
      console.log(`MQTT WARNING: no handler for topic`, topic)
    }
  }

  // handle initial query message
  function onQueryMessage(msg) {
    console.log('MQTT onQueryMessage')

    mqtt.unsubscribe(topics.receiveQuery)

    // add each item in message to cache
    for (const item of msg.payload) {
      const [address, ...others] = item.keys
      const key = `${serialNumber}-${address}` // eg 'CCS123-%I0.10'
      item.value = item.default // use default value, if any
      cache.set(key, item)
      // add other keys to aliases
      for (const alias of others) {
        const key2 = `${serialNumber}-${alias}`
        aliases[key2] = item
      }
    }

    // get shdr strings
    const output = getOutput(cache)

    // send shdr to agent via tcp socket
    console.log(`TCP sending string`, output.slice(0, 40), `...`)
    outputSocket.write(output)

    // best to subscribe to topics at this point,
    // in case status or read messages come in BEFORE query results are delivered,
    // which would clobber these values.
    mqtt.subscribe(topics.receiveStatus)
    mqtt.subscribe(topics.receiveRead)
  }

  // handle status messages
  function onStatusMessage(msg) {
    console.log('MQTT onStatusMessage')
    console.log({ msg })
    // add parts to cache
    const keys = `connection,state,program,step,faults,cpu_time,utc_time,build_no,_ts`.split(
      ','
    )
    for (const key of keys) {
      const value = msg.payload[key]
      cache.set(`${serialNumber}-status-${key}`, value) // eg 'CCS123-status-faults'
    }
    // get shdr strings
    const output = getOutput(cache)
    // send shdr to agent via tcp socket
    console.log(`TCP sending string`, output.slice(0, 40), `...`)
    outputSocket.write(output)
  }

  // handle read messages
  function onReadMessage(msg) {
    console.log('MQTT onReadMessage')
    // make sure we have an array
    if (!Array.isArray(msg.payload)) {
      msg.payload = [msg.payload]
    }
    // add items to cache
    for (const item of msg.payload) {
      const key = `${serialNumber}-${item.address}` // eg 'CCS123-%Q0.0'
      cache.set(key, item) // item has { address, value }
    }
    // get shdr strings
    const output = getOutput(cache)
    // send shdr to agent via tcp socket
    console.log(`TCP sending string`, output.slice(0, 40), `...`)
    outputSocket.write(output)
  }
}

// unpack a message payload byte buffer and append some metadata.
function unpack(topic, buffer) {
  const payload = JSON.parse(buffer.toString())
  const received = new Date()
  const msg = { topic, payload, received }
  return msg
}

// ------------

// define list of calculations to run on cache values to get shdr key/value pairs.
// this is extracted/compiled from dataItems.yaml.

const calcs = [
  {
    dependsOn: ['CCS123-%Q0.0'],
    // key: 'CCS123-%Q0.0',
    key: 'CCS123-printer_start_print',
    value: cache =>
      cache.get('CCS123-%Q0.0').value === 0 ? 'INACTIVE' : 'ACTIVE',
    // types.ACTUATOR_STATE[cache.get('CCS123-%Q0.0')],
  },
  {
    // <Source>%I0.10 OR status.faults 10</Source>
    dependsOn: ['CCS123-%I0.10', 'CCS123-status-faults'],
    key: 'CCS123-estop',
    value: cache => {
      const i010 = cache.get('CCS123-%I0.10').value
      const faults = cache.get('CCS123-status-faults')
      return i010 || (faults && faults[10]) ? 'TRIGGERED' : 'ARMED'
      // return types.EMERGENCY_STOP[i010 || (faults && faults[10])]
    },
  },
]

// get all shdr outputs for the cache values
function getOutput(cache) {
  const output = []
  for (const calc of calcs) {
    const timestamp = new Date().toISOString()
    const key = calc.key
    const value = calc.value(cache) // do calculation
    const shdr = `${timestamp}|${key}|${value}`
    console.log(shdr)
    output.push(shdr)
  }
  return output.join('\n') + '\n'
}
