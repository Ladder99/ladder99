// mqtt provider
// subscribes to mqtt topics, receives messages, dispatches them to subscribers.

import libmqtt from 'mqtt' // see https://www.npmjs.com/package/mqtt

// this class wraps the libmqtt object, adding additional dispatch capabilities.

export class AdapterDriver {
  //
  // provider is something like { url: 'mqtt://localhost:1883', ... }
  async start({ provider }) {
    //
    console.log(`MqttProvider start`, provider)
    this.url = provider.url
    this.connected = false

    // instead of a single handler for each event, we need several, eg one for each device
    this.handlers = {
      connect: [],
      message: [],
    }

    // topic subscribers, coming from mqttSubscriber
    this.subscribers = {} // eg { 'controller': [{ callback, selector, lastMessage }, ...], ... }

    // save last messages for each topic seen
    this.lastMessages = {} // eg { 'controller': 'birth', ... }

    // start the underlying libmqtt connection
    console.log(`MqttProvider connecting to url`, this.url)
    this.mqtt = libmqtt.connect(this.url)

    // register handlers for events from the libmqtt object
    this.mqtt.on('connect', _onConnect.bind(this))
    this.mqtt.on('message', _onMessage.bind(this))

    // handle the initial connect event from the mqtt broker.
    // note: we bound _onConnect to `this`, above.
    function _onConnect() {
      this.connected = true // set flag
      console.log(`MqttProvider connected to shared broker on`, this.url)
      const connectHandlers = this.handlers.connect // a list of onConnect handlers - could be empty.
      // note: if the connect handlers haven't been set up yet, they will be called in the on('connect') method.
      console.log(`MqttProvider calling connect handlers`, connectHandlers)
      for (let handler of connectHandlers) {
        // check if handler has been called - flag is set in the on() method, and here.
        if (!handler.called) {
          handler() // eg onConnect() in mqttSubscriber - subscribes to topics
          handler.called = true
        }
      }
    } // end of _onConnect

    // handle incoming messages and dispatch them to subscribers
    // topic - eg 'l99/pa1/evt/query'
    // message - array of bytes (assumed to be a string or json string)
    // note: we bound _onMessage to `this`, above.
    function _onMessage(topic, message) {
      this.lastMessages[topic] = message // save last message so can dispatch to new subscribers
      // if (!this.subscribers[topic]) return // quit if no subscribers
      let payload = message.toString() // must be let!
      console.log(`MqttProvider got ${topic}: ${payload.slice(0, 140)}`)

      // an empty array is truthy, so check for undefined first
      if (
        this.subscribers[topic] === undefined ||
        this.subscribers[topic].length === 0
      ) {
        console.log(`MqttProvider warning no subscribers for ${topic}`)
        return // quit if no subscribers
      }

      // not sure how we can get around having a trycatch block and json parse,
      // as payload might be a plain string.
      //. check if payload starts with '{' or '[' or digit?
      try {
        payload = JSON.parse(payload)
      } catch (e) {}
      // peek inside the payload if needed to see who to dispatch this message to.
      //. make a dict for dispatching instead of linear search, ie on id?
      //. but would need array of callbacks for plain text msgs
      //. for now we just filter on eg payload.id == some value
      for (let subscriber of this.subscribers[topic]) {
        const { callback, selector } = subscriber
        // selector can be a boolean or a fn of the message payload
        if (selector === false) continue
        if (selector === true || selector(payload)) {
          console.log(`MqttProvider calling subscriber with`, topic)
          callback(topic, message) // note: we pass the original byte array message
        }
      }
    } // end of _onMessage
  } // end of this.start

  // register event handlers, eg 'connect', 'message'.
  // calls connect handler if provider is already connected, else waits for onConnect fn.
  on(event, handler) {
    this.handlers[event] = this.handlers[event] || [] // make sure we have an array
    this.handlers[event].push(handler)
    // call the connect handler if we're already connected -
    // otherwise, will call these in _onConnect.
    //. don't want to call this until all the subscribers are ready!
    if (event === 'connect' && this.connected) {
      console.log(`MqttProvider calling connect handler`, handler)
      handler() // eg onConnect() in mqttSubscriber
      handler.called = true // mark handler as called
    }
    // if (event === 'message' && this.connected) {
    //   console.log(`MqttProvider calling message handler`, handler)
    //   // call handler with last message for all topics we've seen
    //   // this.subscribers = {} // eg { 'controller': [{ callback, selector }, ...], ... }
    //   for (let [topic, handlers] of Object.entries(this.subscribers)) {
    //     const lastMessage = this.lastMessages[topic]
    //     if (lastMessage) {
    //       for (let handler of handlers) {
    //         handler(topic, lastMessage) // eg onMessage(topic, payload) in mqttSubscriber
    //       }
    //     }
    //   }
    // }
  }

  // subscribe to a topic with an optional selector fn.
  // add a callback here, store in the subscriber object with selector.
  // selector can be a function of the payload, or a plain boolean.
  subscribe(topic, callback, selector = payload => true) {
    console.log(
      `MqttProvider subscribe to topic ${topic} with selector ${selector.toString()}`
    )
    if (this.connected) {
      console.log(`MqttProvider already connected - call with last message`)
      // call handler with last message for all topics we've seen
      // this.subscribers = {} // eg { 'controller': [{ callback, selector }, ...], ... }
      // for (let [topic, handlers] of Object.entries(this.subscribers)) {
      const lastMessage = this.lastMessages[topic]
      if (lastMessage) {
        callback(topic, lastMessage) // eg onMessage(topic, payload) in mqttSubscriber
      }
    }
    const subscriber = { callback, selector }
    this.subscribers[topic] = this.subscribers[topic] || []
    this.subscribers[topic].push(subscriber)
    // console.log(`MqttProvider subscribers`, this.subscribers)
    this.mqtt.subscribe(topic) // idempotent - ie okay to subscribe to same topic multiple times (?)
  }

  // pass callback here so can distinguish subscribers
  unsubscribe(topic, callback) {
    console.log(`MqttProvider unsubscribe`, topic)
    const subscribers = this.subscribers[topic] || [] // eg [{ callback, selector }, ...]
    const i = subscribers.findIndex(
      subscriber => subscriber.callback === callback
    )
    if (i !== -1) {
      // if found, remove subscriber from list
      console.log(`MqttProvider found subscriber - removing...`)
      this.subscribers[topic] = [
        ...subscribers.slice(0, i),
        ...subscribers.slice(i + 1),
      ]
      console.log(`MqttProvider down to`, this.subscribers[topic])
      //. if none left, could do this.mqtt.unsubscribe(topic)
    } else {
      console.log(`MqttProvider error - subscriber not found`)
    }
  }

  publish(topic, message) {
    this.mqtt.publish(topic, message)
  }
}
