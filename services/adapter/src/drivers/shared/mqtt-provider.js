// mqtt provider
// subscribes to mqtt topics, receives messages, dispatches them to subscribers.

import libmqtt from 'mqtt' // see https://www.npmjs.com/package/mqtt
// import * as lib from './common/lib.js'

const mqtts = {}

// memoized mqtt constructor
//. memoize by module also? eg 'cutter' vs 'print-apply'?
export function getMqtt(url) {
  if (mqtts[url]) {
    return mqtts[url]
  }
  const mqtt = new MqttProvider(url)
  mqtts[url] = mqtt
  return mqtt
}

// this class wraps the original mqtt object, adding additional dispatch capabilities.
// this is a singleton for a given mqtt url.
export class MqttProvider {
  //
  constructor(url) {
    this.url = url
    this.mqtt = libmqtt.connect(url)
    this.subscribers = {} // key is topic, value is array of { callback, selector }
    this.handlers = {} // key is event name eg 'message', value is handler fn
  }

  on(event, handler) {
    if (event === 'connect') {
      this.mqtt.on('connect', handler)
    } else if (event === 'message') {
      //. so we're gonna need to intercept messages, filter on a selector object,
      // and only THEN, call the wrapped message handler.
      // this.mqtt.on('message', handler)
      this.handlers[event] = handler
    }
  }

  init({ address, topics }) {
    console.log('MQTT-provider initializing mqtt driver')
    const url = `mqtt://${address.host}:${address.port}`

    // connect to mqtt broker/server
    console.log(`MQTT-provider connecting to broker on ${url}...`)
    const mqtt = libmqtt.connect(url)

    // handle connection
    mqtt.on('connect', function onConnect() {
      console.log(`MQTT-provider connected to broker on ${url}`)

      // register message handler
      console.log(`MQTT-provider registering message handler`)
      mqtt.on('message', onMessage) //. bind(this) ?

      // subscribe to any topics defined
      for (let topic of topics) {
        console.log(`MQTT-provider subscribing to ${topic}`)
        mqtt.subscribe(topic)
      }

      // console.log(`MQTT-provider listening for mqtt messages...`)
    })

    // handle incoming messages and dispatch them to subscribers
    // topic - eg 'l99/pa1/evt/query'
    // message - array of bytes (assumed to be a json string)
    function onMessage(topic, message) {
      message = message.toString()
      console.log(
        `MQTT-provider got message ${topic}: ${message.slice(0, 140)}`
      )
      const payload = JSON.parse(message)
      // payload.id
      //. dispatch message to correct subscribers
      for (let subscriber of this.subscibers[topic]) {
        if (subscriber.selector(topic, payload)) {
          subscriber.callback(topic, payload)
        }
      }
    }
  }

  // subscribe to a topic with an optional selector fn.
  // note: we don't need to pass in a callback because this object
  // will always just call the 'message' handler.
  //. but don't we need diff threads to call?
  // ie when we register onMessage, each one can go to a diff target, eh?
  subscribe(topic, selector = () => true) {
    this.subscribers[topic] = this.subscribers[topic] || []
    this.subscribers[topic].push(selector)
  }
}
