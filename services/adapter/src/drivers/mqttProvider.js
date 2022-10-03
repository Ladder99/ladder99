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
    this.subscribers = {} // eg { controller: [{ callback, selector }, ...], ... }

    // start the underlying libmqtt connection
    console.log(`MqttProvider connecting to url`, this.url)
    this.mqtt = libmqtt.connect(this.url)

    // register handlers for events from the libmqtt object
    this.mqtt.on('connect', _onConnect.bind(this))
    this.mqtt.on('message', _onMessage.bind(this))

    // wait for connection to complete
    // add another connect handler that will only resolve when the connection is complete
    // thank you, github copilot...
    await new Promise((resolve, reject) => {
      this.handlers.connect.push(resolve)
    })

    // handle the initial connect event from the mqtt broker.
    // note: we bound onConnect to `this`, above.
    function _onConnect() {
      this.connected = true // set flag
      console.log(`MqttProvider connected to shared broker on`, this.url)
      const connectHandlers = this.handlers.connect // a list of onConnect handlers - could be empty
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
    function _onMessage(topic, message) {
      // if (!this.subscribers[topic]) return // quit if no subscribers
      let payload = message.toString() // must be let!
      console.log(`MqttProvider got ${topic}: ${payload.slice(0, 140)}`)
      if (!this.subscribers[topic]) {
        console.log(`MqttProvider no subscribers for ${topic}`)
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
    }
  }

  // register event handlers, eg 'connect', 'message'.
  // calls connect handler if provider is already connected, else waits for onConnect fn.
  on(event, handler) {
    this.handlers[event] = this.handlers[event] || [] // make sure we have an array
    this.handlers[event].push(handler)
    // call the connect handler if we're already connected -
    // otherwise, will call these in _onConnect.
    if (event === 'connect' && this.connected) {
      console.log(`MqttProvider calling connect handler`, handler)
      handler() // eg onConnect() in mqttSubscriber, which subscribes to topics
      handler.called = true // mark handler as called
    }
  }

  // subscribe to a topic with an optional selector fn.
  // add a callback here, store in the subscriber object with selector.
  // selector can be a function of the payload, or a plain boolean.
  subscribe(topic, callback, selector = payload => true) {
    console.log(
      `MqttProvider subscribe to topic ${topic} with selector ${selector.toString()}`
    )
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
