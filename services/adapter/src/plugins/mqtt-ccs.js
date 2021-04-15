// adapter plugin code
// subscribes to ladder99 mqtt topics, receives messages,
// parses them out, updates cache.

//. this should return a class or factory, as need multiples

//. this will be replaced by a generic mqtt plugin that extracts inputs according
// to an inputs.yaml file.

import libmqtt from 'mqtt' // see https://www.npmjs.com/package/mqtt

// mqtt topics
const topics = {
  sendQuery: 'l99/${deviceId}/cmd/query',
  receiveQuery: 'l99/${deviceId}/evt/query',
  receiveStatus: 'l99/${deviceId}/evt/status',
  receiveRead: 'l99/${deviceId}/evt/read',
}

// map from aliases to items, e.g. "ccs-pa-001-IN10" -> { address: "%I0.9", ... }
const aliases = {}

// timing
let cycleStart = null

// initialize the client plugin.
// queries the device for address space definitions, subscribes to topics.
export function init({ url, cache, deviceId, inputs }) {
  console.log('init', { deviceId })

  // add deviceId to topics
  for (const key of Object.keys(topics)) {
    topics[key] = topics[key].replace('${deviceId}', deviceId)
  }
  console.log('MQTT topics', { topics })

  console.log(`MQTT connecting to broker on ${url}...`)
  const mqtt = libmqtt.connect(url)

  mqtt.on('connect', function onConnect() {
    console.log(`MQTT connected to broker on ${url}`)
    mqtt.on('message', onMessage)
    // ask for initial query message - handler at onQueryMessage
    mqtt.subscribe(topics.receiveQuery)
    mqtt.publish(topics.sendQuery, '{}')
    console.log(`MQTT listening for messages...`)
  })

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
      const [address, ...others] = item.keys // eg '%I0.10' and ['IN11', 'safety.e_stop', 'J3.P12', 'SX1.P10']
      const key = `${deviceId}-${address}` // eg 'ccs-pa-001-%I0.10'
      item.value = item.default // use default value, if any
      cache.set(key, item) // note: this will cause cache to publish shdr
      // add other keys to aliases
      //. replace . with _ ?
      for (const alias of others) {
        const key2 = `${deviceId}-${alias}` // eg 'ccs-pa-001-safety.e_stop'
        aliases[key2] = item
      }
    }

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
    const parts = `connection,state,program,step,faults,cpu_time,utc_time,build_no,_ts`.split(
      ','
    )
    for (const part of parts) {
      const key = `${deviceId}-status-${part}` // eg 'ccs-pa-001-status-faults'
      const item = { value: msg.payload[part] }
      cache.set(key, item) // note: this will cause cache to publish shdr
    }

    // check for step transitions to get timing info
    //. will want to genericize this somehow, or let user write code
    const step = msg.payload.step
    if (step === 'Waiting') {
      //
    } else if (step === 'Cycle_Start') {
      cycleStart = new Date().getTime() // ms
    } else if (step === 'Cycle_Finish') {
      const cycleTime = (new Date().getTime() - cycleStart) / 1000 // sec
      cache.set(`${deviceId}-status-cycle_time`, { value: cycleTime }) // sec
      cycleStart = null
    }

    //. some custom calcs
    const $ = msg.payload
    cache.set(`${deviceId}-status-has-no-faults`, {
      value: Object.keys($.faults).length === 0,
    })
    cache.set(`${deviceId}-status-has-faults`, {
      value: Object.keys($.faults).length > 0,
    })
    cache.set(`${deviceId}-status-has-soft-faults`, {
      value: Object.keys($.faults).some(f => f >= '50'),
    })
    cache.set(`${deviceId}-status-has-hard-faults`, {
      value: Object.keys($.faults).some(f => f < '50'),
    })
    cache.set(`${deviceId}-status-has-fault-ten`, {
      value: Object.keys($.faults).some(f => f === '10'),
    })
    cache.set(
      `${deviceId}-status-has-tamp-fault`,
      //. better way?
      {
        value: Object.keys($.faults)
          .map(f => ['2', '3', '5'].includes(f))
          .some(bool => bool),
      }
    )
    // - key: status-has-feed-fault
    //   path: Object.keys($.faults).map(f=>['1','11','12','13','14,'15'].includes(f)).some(bool=>bool)
    // - key: status-has-feed-warning
    //   path: Object.keys($.faults).map(f=>['50','51'].includes(f)).some(bool=>bool)
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
      const key = `${deviceId}-${item.address}` // eg 'ccs-pa-001-%Q0.0'
      // item has { address, value }
      cache.set(key, item) // note: this will cause cache to publish shdr
    }

    //. too many to do this - get the generic mqtt json working
    const aliases = [
      ['%M55.0', 'life_count'],
      ['%M55.1', 'cycle_count'],
      ['%M55.2', 'fault_count'],
    ]
    for (const alias of aliases) {
      cache.set(`${deviceId}-${alias[1]}`, cache.get(`${deviceId}-${alias[0]}`))
    }
  }
}

// unpack a message payload byte buffer and append some metadata.
function unpack(topic, buffer) {
  const payload = JSON.parse(buffer.toString())
  const received = new Date()
  const msg = { topic, payload, received }
  return msg
}
