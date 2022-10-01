// mqtt provider
// subscribes to mqtt topics, receives messages, dispatches them to subscribers.

import libmqtt from 'mqtt' // see https://www.npmjs.com/package/mqtt

// this class wraps the original mqtt object, adding additional dispatch capabilities.
export class AdapterDriver {
  //
  // url is sthing like 'mqtt://localhost:1883'
  init({ url }) {
    console.log(`MQTT-provider init`, url)
    this.url = url
    this.mqtt = null
    this.connected = false // set flag
    // instead of a single handler for each event, we need several, eg one for each device
    this.handlers = {
      connect: [],
      message: [],
    }
    this.subscribers = {} // key is topic, value is { callback, selector }
    this.start()
  }

  // start the underlying mqtt connection
  start() {
    console.log(`MQTT-provider connecting to url`, this.url)
    this.mqtt = libmqtt.connect(this.url)

    // handle events from the proxied object
    this.mqtt.on('message', onMessage.bind(this))
    this.mqtt.on('connect', onConnect.bind(this))

    function onConnect() {
      this.connected = true // set flag
      console.log(`MQTT-provider connected to shared broker on`, this.url)
      console.log(`MQTT-provider calling connect handlers`)
      for (let handler of this.handlers.connect) {
        if (!handler.called) {
          handler() // eg onConnect(topic, payload) in mqtt-subscriber - subscribes to topics
          handler.called = true
        }
      }
    }

    // handle incoming messages and dispatch them to subscribers
    // topic - eg 'l99/pa1/evt/query'
    // message - array of bytes (assumed to be a string or json string)
    function onMessage(topic, message) {
      if (!this.subscribers[topic]) return // quit if no subscribers
      let payload = message.toString() // must be let!
      console.log(`MQTT-provider got ${topic}: ${payload.slice(0, 140)}`)
      // not sure how we can get around having a trycatch block and json parse,
      // as payload might be a plain string.
      try {
        payload = JSON.parse(payload)
      } catch (e) {}
      // peek inside the payload if needed to see who to dispatch this message to.
      //. make a dict for dispatching instead of linear search, ie on id? but would need array of callbacks for plain text msgs
      // for now we just filter on eg payload.id == some value
      for (let subscriber of this.subscribers[topic]) {
        const { callback, selector } = subscriber
        // selector can be a boolean or a fn of the message payload
        if (selector === false) continue
        if (selector === true || selector(payload)) {
          // console.log(`MQTT-provider calling subscriber with`, topic)
          callback(topic, message) // note: we pass the original byte array message
        }
      }
    }
  }

  // register event handlers, eg 'connect', 'message'
  // calls connect handler if provider is already connected, else waits for onConnect fn
  on(event, handler) {
    this.handlers[event].push(handler)
    // call the handler if we're already connected
    if (event === 'connect' && this.connected) {
      handler()
      handler.called = true
    }
  }

  // subscribe to a topic with an optional selector fn.
  // add a callback here, store in the subscriber object with selector.
  // selector can be a function of the payload, or a plain boolean.
  subscribe(topic, callback, selector = payload => true) {
    console.log(`MQTT-provider subscribe`, topic, selector.toString())
    const subscriber = { callback, selector }
    this.subscribers[topic] = this.subscribers[topic] || []
    this.subscribers[topic].push(subscriber)
    // console.log(`MQTT-provider subscribers`, this.subscribers)
    this.mqtt.subscribe(topic) // idempotent - ie okay to subscribe to same topic multiple times?
  }

  // pass callback here to distinguish subscribers
  unsubscribe(topic, callback) {
    console.log(`MQTT-provider unsubscribe`, topic)
    const subscribers = this.subscribers[topic] || [] // eg [{ callback, selector }, ...]
    const i = subscribers.findIndex(
      subscriber => subscriber.callback === callback
    )
    if (i !== -1) {
      // remove subscriber from list
      console.log(`MQTT-provider found subscriber - removing...`)
      this.subscribers[topic] = [
        ...subscribers.slice(0, i),
        ...subscribers.slice(i + 1),
      ]
      console.log(`MQTT-provider down to`, this.subscribers[topic])
      //. if none left, could do this.mqtt.unsubscribe(topic)
    } else {
      console.log(`MQTT-provider error - subscriber not found`)
    }
  }

  publish(topic, message) {
    this.mqtt.publish(topic, message)
  }
}
