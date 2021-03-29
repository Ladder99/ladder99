// adapter plugin code

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

// initialize the client plugin.
// queries the device for address space definitions, subscribes to topics.
export function init({ url, cache, deviceId, socket }) {
  // connect to broker and call plugin init
  console.log(`MQTT connecting to broker on`, url, `...`)
  //. put mqtt stuff inside plugin
  const mqtt = libmqtt.connect(url)
  mqtt.on('connect', function onConnect() {
    console.log(`MQTT connected to broker on`, url)
    // console.log(`MQTT calling plugin init and subscribing to topics...`)
    // for example, see setups/demo/volumes/adapter/CCS123-dev.mjs
    // plugin.init(mqtt, cache, serialNumber, socket)
    // console.log(`MQTT listening for messages...`)
  })
  // mqtts.push(mqtt)

  // console.log('init', { deviceId })

  // add deviceId to topics
  for (const key of Object.keys(topics)) {
    topics[key] = topics[key].replace('${deviceId}', deviceId)
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
      const key = `${deviceId}-${address}` // eg 'CCS123-%I0.10'
      item.value = item.default // use default value, if any
      cache.set(key, item)
      // add other keys to aliases
      for (const alias of others) {
        const key2 = `${deviceId}-${alias}`
        aliases[key2] = item
      }
    }

    //...
    // // get shdr strings
    // const output = getOutput(cache)

    // // send shdr to agent via tcp socket
    // console.log(`TCP sending string`, output.slice(0, 40), `...`)
    // outputSocket.write(output)

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
      cache.set(`${deviceId}-status-${key}`, value) // eg 'CCS123-status-faults'
    }
    //...
    // // get shdr strings
    // const output = getOutput(cache)
    // // send shdr to agent via tcp socket
    // console.log(`TCP sending string`, output.slice(0, 40), `...`)
    // outputSocket.write(output)
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
      const key = `${deviceId}-${item.address}` // eg 'CCS123-%Q0.0'
      cache.set(key, item) // item has { address, value }
    }
    //...
    // // get shdr strings
    // const output = getOutput(cache)
    // // send shdr to agent via tcp socket
    // console.log(`TCP sending string`, output.slice(0, 40), `...`)
    // outputSocket.write(output)
  }
}

// unpack a message payload byte buffer and append some metadata.
function unpack(topic, buffer) {
  const payload = JSON.parse(buffer.toString())
  const received = new Date()
  const msg = { topic, payload, received }
  return msg
}
