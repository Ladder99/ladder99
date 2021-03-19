// adapter plugin code
// derived from models/ccs-pa and setups/demo/devices/CCS123.yaml etc

//. this is experimental for development

const topics = {
  sendQuery: 'l99/${serialNumber}/cmd/query',
  receiveQuery: 'l99/${serialNumber}/evt/query',
  receiveStatus: 'l99/${serialNumber}/evt/status',
  receiveRead: 'l99/${serialNumber}/evt/read',
}

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

  mqtt.subscribe(topics.receiveQuery)
  mqtt.publish(topics.sendQuery, '{}')

  mqtt.on('message', onMessage)
  function onMessage(topic, buffer) {
    console.log('MQTT onMessage', { topic })
    if (topic === topics.receiveQuery) {
      onQueryMessage(topic, buffer)
    } else {
      console.log(`MQTT WARNING: no handler for topic`, topic)
    }
  }

  function onQueryMessage(topic, buffer) {
    console.log('MQTT onQueryMessage')

    mqtt.unsubscribe(topics.receiveQuery)

    const msg = unpack(topic, buffer)

    // add each item in message to cache
    for (const item of msg.payload) {
      const [address, ...others] = item.keys
      const key = `${serialNumber}-${address}` // eg 'CCS123-%I0.10'
      item.value = item.default
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
    console.log(`TCP sending string`, output.slice(0, 20), `...`)
    outputSocket.write(output)

    // best to subscribe to topics at this point,
    // in case status or read messages come in BEFORE query results are delivered,
    // which would clobber these values.
    mqtt.subscribe(topics.receiveStatus, onStatusMessage)
    // mqtt.subscribe(topics.receiveRead, onReadMessage)
  }

  function onStatusMessage(topic, buffer) {
    const obj = unpack(topic, buffer)
    cache.save(obj)
  }

  // function onReadMessage(topic, buffer) {
  //   const obj = unpack(topic, buffer)
  //   if (!Array.isArray(obj.data)) {
  //     obj.data = [obj.data]
  //   }
  //   // cache.save(obj)
  //   for (const item of obj.data) {
  //     const key = serialNumber + '-' + item.address
  //     const value = 0
  //     cache.set(key, value)
  //   }
  // }
}

// unpack a message payload byte buffer and append some metadata.
function unpack(topic, buffer) {
  const payload = JSON.parse(buffer.toString())
  const received = new Date()
  const msg = { topic, payload, received }
  return msg
}

// define list of calculations to run on cache values to get shdr key/value pairs
const calcs = [
  {
    dependsOn: ['CCS123-%Q0.0'],
    key: 'CCS123-%Q0.0',
    value: cache =>
      cache.get('CCS123-%Q0.0').value === 0 ? 'INACTIVE' : 'ACTIVE',
  },
  {
    // <Source>%I0.10 OR status.faults 10</Source>
    dependsOn: ['CCS123-%I0.10', 'CCS123-faults'],
    key: 'CCS123-estop',
    value: cache => {
      const i010 = cache.get('CCS123-%I0.10').value
      const faults = cache.get('CCS123-faults')
      return i010 || (faults && faults.get(10)) ? 'ARMED' : 'TRIGGERED'
    },
  },
]

// get all shdr outputs for the cache values
function getOutput(cache) {
  const output = []
  for (const calc of calcs) {
    const timestamp = new Date().toISOString()
    const key = calc.key
    const value = calc.value(cache)
    const shdr = `${timestamp}|${key}|${value}`
    console.log(shdr)
    output.push(shdr)
  }
  return output.join('\n') + '\n'
}
