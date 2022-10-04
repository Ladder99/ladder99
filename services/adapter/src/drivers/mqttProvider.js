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
    this.mqtt.on('connect', onConnect.bind(this))
    this.mqtt.on('message', onMessage.bind(this))

    // handle the initial connect event from the mqtt broker.
    // note: we bound onConnect to `this`, above.
    //. make this a method
    function onConnect() {
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
    }

    // handle incoming messages and dispatch them to subscribers
    // topic - eg 'l99/pa1/evt/query'
    // message - array of bytes (assumed to be a string or json string)
    // note: we bound onMessage to `this`, above.
    //. make this a method
    function onMessage(topic, message) {
      this.lastMessages[topic] = message // save last message so can dispatch to new subscribers
      // if (!this.subscribers[topic]) return // quit if no subscribers
      let payload = message.toString() // must be let - don't overwrite message

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

      // loop over subscribers to this topic - linear search.
      // peek inside the payload if needed to see who to dispatch this message to.
      for (let subscriber of this.subscribers[topic]) {
        const { callback, selector } = subscriber
        console.log(
          `MqttProvider checking subscriber`,
          callback.name,
          selector.toString()
        )
        // selector can be a boolean or a fn of the message payload
        // if (selector === false) continue // skip this subscriber
        // if (selector === true || selector(payload)) {
        // if (selector === true || selectorMatch(payload, selector)) {
        if (selectorMatch(payload, selector)) {
          console.log(
            `MqttProvider call`,
            callback.name,
            selector.toString(),
            topic,
            message.toString()
          )
          callback(topic, message) // note: we pass the original byte array message
        }
      }
    } // end of onMessage
  } // end of start

  // register event handlers, eg 'connect', 'message'.
  // calls connect handler if provider is already connected, else waits for onConnect fn.
  on(event, handler) {
    this.handlers[event] = this.handlers[event] || [] // make sure we have an array
    this.handlers[event].push(handler)
    // call the connect handler if we're already connected -
    // otherwise, will call these in onConnect.
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
  // callback is a function of (topic, message) - eg onMessage(topic, payload) in mqttSubscriber.
  // selector can be a function of the payload, or a plain boolean.
  // sendLastMessage - if true, send the last message seen on this topic to the callback.
  subscribe(topic, callback, selector = true, sendLastMessage = true) {
    console.log(`MqttProvider subscribe ${topic} when ${selector.toString()}`)

    // if we're already connected to the broker, call callback with last message received.
    if (this.connected && sendLastMessage) {
      const lastMessage = this.lastMessages[topic]
      if (lastMessage) {
        console.log(`MqttProvider send lastMessage ${topic}: ${lastMessage}`)
        callback(topic, lastMessage) // eg onMessage(topic, payload) in mqttSubscriber
      }
    }

    // add to subscriber list if not already there
    const subscriber = { callback, selector }
    this.subscribers[topic] = this.subscribers[topic] || [] // initialize array
    for (let subscriber of this.subscribers[topic]) {
      if (
        //. these don't work? maybe the callback.bind(this) makes a new fn each time?
        // subscriber.callback === callback &&
        // subscriber.selector === selector
        // so use strings
        //. this fails because strings are the same even if selector encloses different data (eg id)
        // eg callback.name='onMessage' and selector.toString()='payload=>payload.id===foo.id'
        // then only one device would get a subscription to the topic.
        // somehow need to look inside the closure - how do?
        // subscriber.callback.name === callback.name &&
        // subscriber.selector.toString() === selector.toString()
        subscriber.callback.name === callback.name &&
        selectorEqual(subscriber.selector, selector)
      ) {
        console.log(
          `MqttProvider already subscribed to ${topic} with same callback and selector`
        )
        return
      }
    }
    this.subscribers[topic].push(subscriber)

    console.log(`MqttProvider subscribers`, this.subscribers)
    this.mqtt.subscribe(topic) // idempotent - ie okay to subscribe to same topic multiple times (?)
  }

  // unsubscribe from a topic.
  // pass callback and selector here so can distinguish subscribers.
  unsubscribe(topic, callback, selector) {
    console.log(`MqttProvider unsubscribe`, topic, callback.name, selector)
    const subscribers = this.subscribers[topic] || [] // eg [{ callback, selector }, ...]
    const i = subscribers.findIndex(
      subscriber =>
        subscriber.callback.name === callback.name &&
        selectorEqual(subscriber.selector, selector)
    )
    // if found, remove subscriber from list
    if (i >= 0) {
      this.subscribers[topic].splice(i, 1) // modifies in place
      console.log(`MqttProvider unsubscribed`, topic, callback.name, selector)
      console.log(`MqttProvider down to`, this.subscribers[topic])
      //. if none left, could do this.mqtt.unsubscribe(topic)
    } else {
      console.log(
        `MqttProvider warning ${callback.name} with selector ${selector} not subscribed to ${topic}`
      )
    }
  }

  // publish a message on a topic - message is a string or byte array.
  publish(topic, message) {
    this.mqtt.publish(topic, message)
  }
}

// check if the given payload matches the selector.
// eg payload = { id: 15, name: 'foo' }, selector = { id: 15 } would return true.
function selectorMatch(payload, selector) {
  if (typeof selector === 'object') {
    for (let [key, value] of Object.entries(selector)) {
      if (payload[key] !== value) return false
    }
    return true
  }
  if (typeof selector === 'boolean') {
    return selector
  }
  return false
}

// check if the given selectors are the same,
// eg selector1 = { id: 15 }, selector2 = { id: 15 } returns true.
// important: order of attributes must be the same!
function selectorEqual(selector1, selector2) {
  return JSON.stringify(selector1) === JSON.stringify(selector2)
}
