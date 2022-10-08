// mqtt provider
// subscribes to mqtt topics, receives messages, dispatches them to subscribers.

// this class wraps the libmqtt object, adding additional dispatch capabilities.
// allows us to have a single libmqtt connection that can dispatch to multiple drivers.

import libmqtt from 'mqtt' // see https://www.npmjs.com/package/mqtt

export class AdapterDriver {
  //
  // provider is a shared connection definition from setup.yaml,
  // like { driver: 'mqttProvider', url: 'mqtt://localhost:1883', ... }
  async start({ provider }) {
    //
    this.me = 'MqttProvider'
    console.log(this.me, `start`, provider)
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
    console.log(this.me, `connecting to shared broker at url`, this.url)
    this.mqtt = libmqtt.connect(this.url)

    // register handlers for events from the libmqtt object
    this.mqtt.on('connect', onConnect.bind(this))
    this.mqtt.on('message', onMessage.bind(this))

    // handle the initial connect event from the mqtt broker.
    // note: we bound onConnect to `this`, above.
    //. make this a method
    function onConnect() {
      console.log(this.me, `connected to shared broker on`, this.url)
      this.connected = true // set flag
      const connectHandlers = this.handlers.connect // a list of onConnect handlers - could be empty.
      // note: if the connect handlers haven't been set up yet, they will be called in the on('connect') method.
      console.log(this.me, `calling connect handlers`, connectHandlers)
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
      //
      // quit if no subscribers to topic
      if (
        // an empty array is truthy, so check for undefined first
        this.subscribers[topic] === undefined ||
        this.subscribers[topic].length === 0
      ) {
        console.log(this.me, `warning no subscribers for ${topic}`)
        return
      }

      // save last message so can dispatch to new subscribers
      this.lastMessages[topic] = message // byte array

      // must be let - and don't overwrite message variable
      let payload = message.toString()

      // console.log(this.me, `got ${topic}: ${payload.slice(0, 140)}`)

      // convert to js object, else leave as string
      // not sure how we can get around having a trycatch block and json parse,
      // as payload might be a plain string.
      //. check if payload starts with '{' or '[' or digit?
      try {
        payload = JSON.parse(payload)
      } catch (e) {}

      // loop over subscribers to this topic - linear search,
      // as can match more than one subscriber.
      // use fn to peek inside the payload to see who to dispatch this message to.
      for (let subscriber of this.subscribers[topic]) {
        const { callback, selector } = subscriber
        // const { callback, filterFn } = subscriber
        // console.log(this.me, `checking subscriber`, callback.name, selector)
        // selector can be a boolean or a fn of the message payload
        // if (selector === false) continue // skip this subscriber
        // if (selector === true || selector(payload)) {
        // if (selector === true || selectorFilter(payload, selector)) {
        // if (selectorFilter(payload, selector)) {
        // if (filterFn(payload)) {
        // if (selector.filter(payload)) {
        if (selector === false) continue // skip this subscriber
        if (selector === true || selector.filter(payload)) {
          console.log(this.me, `call`, callback.name, topic, payload)
          callback(topic, message) // note: we pass the original byte array message
        }
      }
    } // end of onMessage
  } // end of start

  // register event handlers for 'connect', 'message'.
  // calls connect handler if provider is already connected, else waits for onConnect fn.
  on(event, handler) {
    this.handlers[event] = this.handlers[event] || [] // make sure we have an array
    this.handlers[event].push(handler)
    // call the connect handler if we're already connected -
    // otherwise, will call these in onConnect.
    //. don't want to call this until all the subscribers are ready!
    if (event === 'connect' && this.connected) {
      console.log(this.me, `calling connect handler`, handler)
      handler() // eg onConnect() in mqttSubscriber
      handler.called = true // mark handler as called
    }
  }

  // subscribe to a topic with callback, filter, and equal fns.
  // callback is a function of (topic, message) - eg onMessage(topic, message) in mqttSubscriber,
  // where message is a byte array.
  // filterFn is a function of the payload (message as js object or string), that returns true
  // if the message should be dispatched to the callback.
  // equalFn is a function of two subscribers with { callback, filterFn, equalFn },
  // that checks for equality.
  // sendLastMessage - if true, send the last message seen on this topic to the callback.
  // subscribe(topic, callback, selector = true, sendLastMessage = true) {
  subscribe(
    topic,
    callback,
    // filterFn = payload => true,
    // equalFn = (subscriber1, subscriber2) => true,
    // selector = { filter: payload => true, equal: (sub1, sub2) => true },
    selector = true,
    sendLastMessage = true
  ) {
    // console.log(this.me, `subscribe ${topic} when`, filterFn.toString())
    // console.log(this.me, `subscribe ${topic} when`, selector.filter.toString())
    // console.log(this.me, `subscribe ${topic} when`, selector.filter.toString())
    console.log(this.me, `subscribe ${topic} when`, String(selector))

    // if we're already connected to the broker, call callback with last message received,
    // then continue.
    if (this.connected && sendLastMessage) {
      const lastMessage = this.lastMessages[topic]
      if (lastMessage) {
        console.log(this.me, `send last msg ${topic}:`, lastMessage.toString())
        callback(topic, lastMessage) // eg onMessage(topic, payload) in mqttSubscriber
      }
    }

    // add to subscriber list if not already there
    // const newSubscriber = { callback, selector }
    // const newSubscriber = { callback, ...selector } //. get { callback, filter, equal } ?
    const newSubscriber = { callback, selector }
    // const newSubscriber = { callback, filterFn, equalFn }
    this.subscribers[topic] = this.subscribers[topic] || [] // initialize array
    for (let subscriber of this.subscribers[topic]) {
      if (
        //. these don't work? maybe the callback.bind(this) makes a new fn each time?
        // so use strings
        // subscriber.callback === callback &&
        // subscriber.selector === selector
        //. handle case where these match but diff devices - how?
        subscriber.callback.name === callback.name &&
        String(subscriber.selector) === String(selector)
      ) {
        console.log(this.me, `already subscribed ${topic} with same props`)
        return
      }
    }
    this.subscribers[topic].push(newSubscriber)

    // print subscribers
    console.log(this.me, `subscribers:`)
    for (let [topic, subscribers] of Object.entries(this.subscribers)) {
      console.log(`  ${topic}:`)
      for (let subscriber of subscribers) {
        console.log(`    ${subscriber.callback.name}:`, subscriber.selector)
        // console.log(`    ${subscriber.callback.name}:`, subscriber.filterFn)
      }
    }

    // now actually subscribe to the mqtt broker
    this.mqtt.subscribe(topic) // idempotent - ie okay to subscribe to same topic multiple times (?)
  }

  // unsubscribe from a topic.
  // pass callback and selector here so can distinguish subscribers.
  unsubscribe(topic, callback, selector) {
    console.log(this.me, `unsubscribe`, topic, callback.name, String(selector))
    const subscribers = this.subscribers[topic] || [] // eg [{ callback, selector }, ...]
    //. handle case where these match but diff devices - how?
    const i = subscribers.findIndex(
      subscriber =>
        subscriber.callback.name === callback.name &&
        // selectorEqual(subscriber.selector, selector)
        String(subscriber.selector) === String(selector)
    )
    // if found, remove subscriber from list
    if (i >= 0) {
      this.subscribers[topic].splice(i, 1) // modifies in place
      console.log(
        this.me,
        `unsubscribed`,
        topic,
        callback.name,
        String(selector)
      )
      console.log(this.me, `${topic} down to`, this.subscribers[topic])
      //. if none left, could unsubscribe from the broker -
      // this.mqtt.unsubscribe(topic)
    } else {
      console.log(
        this.me,
        `warning ${callback.name} with selector ${String(
          selector
        )} not subscribed to ${topic}`
      )
    }
  }

  // publish a message on a topic - message is a string or byte array.
  publish(topic, message) {
    this.mqtt.publish(topic, message)
  }
}

// //. these are not ideal, might be slow - but running out of time

// // check if the given payload matches the selector.
// // eg payload = { id: 15, name: 'foo' }, selector = { id: 15 } would return true.
// function selectorFilter(payload, selector) {
//   if (selector === true || selector === false) return selector
//   for (let [key, value] of Object.entries(selector)) {
//     // bug: need !=, not !== for string/number coercion!
//     if (payload[key] != value) return false
//   }
//   return true
// }

// // check if the given selectors are the same,
// // eg selector1 = { id: 15 }, selector2 = { id: 15 } returns true.
// // important: order of attributes must be the same!
// function selectorEqual(selector1, selector2) {
//   return JSON.stringify(selector1) === JSON.stringify(selector2)
// }
