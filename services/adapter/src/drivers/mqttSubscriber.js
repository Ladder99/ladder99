// MqttSubscriber driver

// subscribes to mqtt topics through shared mqttProvider, receives messages,
// parses them out as JSON, updates cache values, which sends SHDR to agent.

//. refactor/chop this code up into smaller fns - hard to read.
// be careful with types, keyvalues, closure vars, and this vs that.

import { getEquationKeys, getEquationKeys2 } from '../helpers.js'
import * as lib from '../common/lib.js'

export class AdapterDriver {
  //
  // start the MqttSubscriber driver - subscribes to topics from the MqttProvider.
  async start({ source, device, cache, module, provider }) {
    //
    this.me = `MqttSubscriber ${device.name}:`
    console.log(this.me, 'starting driver')

    this.source = source

    // IMPORTANT: types IS used - by the part(cache, $) fn evaluation
    const { types } = module // module is { inputs, outputs, types }, from yaml files

    // keyvalue store for yaml code to use
    const keyvalues = {}

    // get dict of selector fns for each topic
    const selectors = this.getSelectors()

    // save topic handlers
    // iterate over message handlers - array of [topic, handler]
    // eg [['l99/ccs/evt/query', { unsubscribe, initialize, definitions, inputs, ... }], ...]
    const topicHandlers = {}
    const handlers = module.inputs?.handlers || {}
    for (let [topic, handler] of Object.entries(handlers)) {
      topic = replaceDeviceId(topic)
      topicHandlers[topic] = handler
    }

    // // pre-evaluate expressions from yaml code
    // // eg handler.lookup could be '($, js) => eval(js)' // woo double eval
    // //. is it okay to do this here? no - closure messed it up
    // for (let handler of Object.values(handlers)) {
    //   const lookup = handler.lookup || (() => {})
    //   // console.log(this.me, `lookup fn`, lookup.toString())
    //   handler.lookupFn = eval(lookup)
    // }

    // AWAIT here until provider is connected?
    await untilProviderConnected(provider)
    async function untilProviderConnected(provider) {
      while (!provider.connected) {
        console.log(this.me, `waiting for provider to connect...`)
        await lib.sleep(2000)
      }
    }

    // register connection handler
    //. move onConnect to a method, but be careful with closure vars!
    // provider.on('connect', this.onConnect.bind(this))
    const that = this
    provider.on('connect', function onConnect() {
      console.log(that.me, `connected to MQTT-provider`)

      // subscribe to any topics defined in inputs.yaml,
      // eg [{topic:'controller'}, {topic:'l99/B01000/evt/io'}, ...]
      //. this will be const subscriptions = module.inputs?.handlers?.connect?.subscribe || []
      const subscriptions = module.inputs?.connect?.subscribe || []
      for (const subscription of subscriptions) {
        const topic = replaceDeviceId(subscription.topic)
        // can set a topic to false in setup.yaml to not subscribe to it
        const selector = selectors[topic]
        if (selector && selector !== false) {
          console.log(that.me, `subscribing to ${topic}`)
          // we extend the mqtt api to add callback and optional selector for dispatcher to filter on.
          // we need the callback because otherwise the provider wouldn't know where to send msg,
          // ie which of the many MqttSubscriber instances to send to.
          // onMessage is defined below.
          // mqtt.subscribe(topic) // old code using libmqtt
          //. this will be provider.subscribe(topic, this.onMessage.bind(this), selector) //. will this work with unsubscribe?
          provider.subscribe(topic, onMessage, selector)
        }
      }

      // publish to any topics defined
      const publish = module.inputs?.connect?.publish || [] // list of { topic, message }
      // const publish = module.inputs?.handlers?.connect?.publish || [] // list of { topic, message }
      for (const entry of publish) {
        const topic = replaceDeviceId(entry.topic)
        console.log(that.me, `publishing to ${topic}`)
        provider.publish(topic, entry.message)
      }

      // do any static inits
      const inits = module.inputs?.connect?.static || {} // eg { procname: KITTING }
      // const inits = module.inputs?.handlers?.connect?.static || {} // eg { procname: KITTING }
      console.log(that.me, 'static inits:', inits)
      for (const key of Object.keys(inits)) {
        const cacheId = `${device.id}-${key}`
        const value = inits[key]
        cache.set(cacheId, value)
      }

      console.log(that.me, `listening for messages...`)
    }) // end of onConnect

    // handle incoming messages.
    // eg for ccs-pa have query, status, and read messages.
    // topic - mqtt topic, eg 'l99/pa1/evt/query'
    // message - array of bytes (assumed to be a string or json string)
    function onMessage(topic, payload) {
      const handler = topicHandlers[topic]
      if (!handler) {
        console.log(that.me, `warning: no handler for topic`, topic)
      } else {
        payload = payload.toString() // bytes to string

        console.log(`MqttSubscriber msg ${topic}: ${payload.slice(0, 140)}`)

        // if payload is plain text, set handler.text true in inputs.yaml - else parse as json
        if (!handler.text) payload = JSON.parse(payload) // string to js object

        // unsubscribe from topics as needed
        for (const entry of handler.unsubscribe || []) {
          const topic = replaceDeviceId(entry.topic)
          console.log(that.me, `unsubscribe from ${topic}`)
          provider.unsubscribe(topic, onMessage) //. bind to this
        }

        // run initialize handler
        // eg can assign payload values to a dictionary $ here for fast lookups.
        // eg initialize: 'payload.forEach(item => $[item.address] = item)'
        // eg initialize: '$ = payload; $.faultKeys=Object.keys(payload.faults);'
        //. parameterize this so don't need to put code in the yaml
        // console.log(that.me,`run initialize handler`)
        let $ = {} // a variable representing payload data - must be let not const
        eval(handler.initialize) // eg '$ = payload'

        // this algorithm iterates over expressions, evaluates each, and adds value to cache.
        // expressions is an array of [key, expression] - eg [['fault_count', '%M55.2'], ...].
        //. this could be like the other algorithm - use msg('foo'), calculations -
        // then would be reactive instead of evaluating each expression, and unifies code!
        //. call this 'eval_expressions'
        if (handler.algorithm === 'iterate_expressions') {
          const expressions = handler.expressions || {}
          for (const [key, expression] of Object.entries(expressions)) {
            // use the lookup function to get value from payload
            const lookupFn = eval(handler.lookup) // eg '($, js) => eval(js)' - convert string to a fn
            const value = lookupFn($, expression) // eg expression=`dxm: $==='birth'` -> value=true
            // note guard for undefined value.
            // if need to reset a cache value, must pass value 'UNAVAILABLE' explicitly.
            if (value !== undefined) {
              const cacheId = device.id + '-' + key // eg 'pa1-fault_count'
              cache.set(cacheId, value) // save to the cache - may send shdr to agent
            }
          }
          //
          //. call this iterate_payload_contents
        } else if (handler.algorithm === 'iterate_message_contents') {
          //
          // get set of keys for eqns we need to execute based on the payload
          // eg set{'has_current_job', 'job_meta', ...}
          //. call this dependencies = getDependencies?
          //  or references = getReferences ?
          // yeah
          let equationKeys = getEquationKeys(payload, handler.maps)

          // make sure all '=' expressions will be evaluated
          lib.mergeIntoSet(equationKeys, handler.alwaysRun)

          let depth = 0

          do {
            const equationKeys2 = new Set()
            // evaluate each eqn once, and put the results in the cache.
            for (let equationKey of equationKeys) {
              const expression = handler.augmentedExpressions[equationKey]
              //. should we be passing keyvalues here? does it get stuck in the closure?
              const value = expression.fn(cache, $, keyvalues) // run the expression fn
              if (value !== undefined) {
                const cacheId = device.id + '-' + equationKey // eg 'pa1-fault_count'
                cache.set(cacheId, value) // save to the cache - may send shdr to tcp
                equationKeys2.add(cacheId)
              }
            }
            //. merge this algorithm with getEquationKeys
            equationKeys = getEquationKeys2(equationKeys2, handler.maps)
            depth += 1
          } while (equationKeys.size > 0 && depth < 6) // prevent endless loops
          //
        } else if (handler.algorithm) {
          console.log(that.me, `error unknown algorithm ${handler.algorithm}`)
          //
        } else {
          console.log(that.me, `error no algorithm set for ${topic}`)
        }

        // subscribe to any topics
        for (const entry of handler.subscribe || []) {
          const topic = replaceDeviceId(entry.topic)
          console.log(that.me, `subscribe to ${topic}`)
          provider.subscribe(topic, onMessage, selectors[topic])
          //. provider.subscribe(topic, this.onMessage.bind(this), selectors[topic])
        }
      }
    } // end of onMessage

    function replaceDeviceId(str) {
      return str.replace('${deviceId}', device.id)
    }
  }

  // get a dictionary of selectors for each topic - eg from setup.yaml -
  //   topics:
  //     controller: true
  //     l99/B01000/evt/io:
  //       id: 535172
  // this will return selectors = { 'controller': true, 'l99...': payload=>payload.id==535172, ... }
  // where key is the mqtt message topic.
  // this acts as a filter/dispatch mechanism for the topics defined in the inputs.yaml.
  // important: if topic is not included in this section it won't be subscribed to!
  //. note: for now we assume selection is done by id - expand to arbitrary objects later.
  getSelectors() {
    const topics = this.source?.topics || {} // eg { 'controller', 'l99/B01000/evt/io' }
    console.log(this.me, `get selectors from`, topics)
    const selectors = {} // key is topic, value will be selector - boolean or function of payload
    for (let topic of Object.keys(topics)) {
      const value = topics[topic] // eg { id: 513241 }, or true, or false
      let selector = true // if setup lists a topic, assume it's to be included
      if (typeof value === 'boolean') {
        selector = value // true or false
      } else if (value.id !== undefined) {
        //.. for now assume selection is done by id - expand to arbitrary objects later!
        // NOTE: we use == instead of ===, in case payload.id is a string
        selector = payload => payload.id == value.id
      }
      // selector can be boolean or a function of the mqtt message payload
      console.log(
        this.me,
        `got selector for topic ${topic}, ${String(
          selector
        )}, with value=${value}`
      )
      selectors[topic] = selector
    }
    return selectors
  }
}
