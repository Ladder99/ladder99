// mqtt provider
// subscribes to mqtt topics, receives messages, dispatches them to subscribers.

import libmqtt from 'mqtt' // see https://www.npmjs.com/package/mqtt
// import * as lib from '../../common/lib.js'

const mqtts = {} // key is url, value is an MqttProvider object

// memoized mqtt constructor
//. memoize by module also, eg 'cutter' vs 'print-apply'?
export function getMqtt(url) {
  if (mqtts[url]) {
    return mqtts[url]
  }
  const mqtt = new MqttProvider(url)
  mqtts[url] = mqtt
  return mqtt
}

//

// this class wraps the original mqtt object, adding additional dispatch capabilities.
// this is a singleton for a given mqtt url.
export class MqttProvider {
  //
  // url is sthing like 'mqtt://localhost:1883'
  constructor(url) {
    this.url = url
    // instead of a single handler for each event, we need several, eg one for each device
    //. uhh handlers vs subscribers?
    this.handlers = {
      connect: [],
      message: [],
    }
    this.subscribers = {} // key is topic, value is { callback, selector }
  }

  // register event handlers, eg 'connect', 'message'
  on(event, handler) {
    this.handlers[event].push(handler)
  }

  // start the underlying mqtt connection
  start() {
    console.log(`MQTT-provider connecting to url`, this.url)
    this.mqtt = libmqtt.connect(this.url)

    // handle events from the proxied object
    this.mqtt.on('message', onMessage.bind(this))
    this.mqtt.on('connect', onConnect.bind(this))

    function onConnect() {
      console.log(`MQTT-provider connected to broker on`, this.url)
      console.log(`MQTT-provider calling connect handlers`)
      for (let handler of this.handlers.connect) {
        handler() // eg onConnect(topic, payload) in mqtt-subscriber - subscribes to topics
      }
    }

    // handle incoming messages and dispatch them to subscribers
    // topic - eg 'l99/pa1/evt/query'
    // message - array of bytes (assumed to be a json string)
    function onMessage(topic, message) {
      message = message.toString()
      console.log(
        `MQTT-provider got message ${topic}: ${message.slice(0, 140)}`
      )
      const payload = JSON.parse(message)
      // peek inside the payload to see who to dispatch this message to.
      //. for now we need to filter on eg payload.id === some value
      //. make a dict for dispatching instead of linear search, ie on id
      // note: subscriber = { callback, selector }
      for (let subscriber of this.subscibers[topic]) {
        const selector = subscriber?.selector || (() => true)
        if (selector(topic, payload)) {
          subscriber.callback(topic, payload)
        }
      }
    }
  }

  // subscribe to a topic with an optional selector fn.
  // add a callback here, store in the subscriber object with selector.
  subscribe(topic, callback, selector = payload => true) {
    console.log(`MQTT-provider subscribe to ${topic}`, selector.toString())
    this.subscribers[topic] = this.subscribers[topic] || []
    const subscriber = { callback, selector }
    this.subscribers[topic].push(subscriber)
    this.mqtt.subscribe(topic) //. hopefully idempotent
  }

  //. pass callback here to distinguish subscribers
  unsubscribe(topic) {
    console.log(`MQTT-provider unsubscribe ${topic} - not yet implemented`)
    // this.subscribers[topic]. remove topic uuid
    // if none left,
    // this.mqtt.unsubscribe(topic)
  }

  publish(topic, message) {
    this.mqtt.publish(topic, message)
  }
}
