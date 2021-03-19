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
  // mqtt.subscribe(topics.receiveStatus)
  // mqtt.subscribe(topics.receiveRead)
  mqtt.publish(topics.sendQuery, '{}')

  mqtt.on('message', onMessage)
  function onMessage(topic, buffer) {
    console.log('MQTT onMessage', { topic })

    const handlers = {
      [topics.receiveQuery]: onQueryMessage,
      [topics.receiveStatus]: onStatusMessage,
      [topics.receiveRead]: onReadMessage,
    }
    const handler = handlers[topic]
    if (handler) {
      handler(topic, buffer)
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
    console.log(`TCP sending string`, output.slice(0, 40), `...`)
    outputSocket.write(output)

    // best to subscribe to topics at this point,
    // in case status or read messages come in BEFORE query results are delivered,
    // which would clobber these values.
    mqtt.subscribe(topics.receiveStatus)
    mqtt.subscribe(topics.receiveRead)
  }

  function onStatusMessage(topic, buffer) {
    console.log('MQTT onStatusMessage')
    const msg = unpack(topic, buffer)
    console.log({ msg })

    // payload eg:
    // connection: 'online',
    // state: 400, // 200 stopped, 400 running
    // program: 'pgm0',
    // step: 'step1',
    // faults: {},
    // cpu_time: 691322.50763624,
    // utc_time: 1.6098097061826477e9,
    // build_no: '1.3.0.3',
    // _ts: 1609809706196, // msec since 1970-01-01

    // add msg parts to cache
    const keys = `connection,state,program,step,faults,cpu_time,utc_time,build_no,_ts`.split(
      ','
    )
    for (const key of keys) {
      const value = msg.payload[key]
      cache.set(`${serialNumber}-status-${key}`, value)
    }

    // get shdr strings
    const output = getOutput(cache)

    // send shdr to agent via tcp socket
    console.log(`TCP sending string`, output.slice(0, 40), `...`)
    outputSocket.write(output)
  }

  function onReadMessage(topic, buffer) {
    console.log('MQTT onReadMessage')
    const msg = unpack(topic, buffer)
    if (!Array.isArray(msg.payload)) {
      msg.payload = [msg.payload]
    }
    // item has { address, value }
    for (const item of msg.payload) {
      const key = `${serialNumber}-${item.address}`
      cache.set(key, item)
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
    dependsOn: ['CCS123-%I0.10', 'CCS123-status-faults'],
    key: 'CCS123-estop',
    value: cache => {
      const i010 = cache.get('CCS123-%I0.10').value
      const faults = cache.get('CCS123-status-faults')
      return i010 || (faults && faults[10]) ? 'TRIGGERED' : 'ARMED'
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
