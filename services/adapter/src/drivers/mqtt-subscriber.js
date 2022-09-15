// mqtt-subscriber driver

// subscribes to mqtt topics through shared provider, receives messages,
// parses them out as JSON, updates cache values, which sends SHDR to agent.

// this file is a copy of drivers/mqtt-json.js - //. merge them together and delete that one

import { getEquationKeys, getEquationKeys2 } from '../helpers.js'
import * as lib from '../common/lib.js'

//. move this into class?
//. and make it a const - call it sthing else?
//. pass it into expression fns as a param?
// see https://stackoverflow.com/questions/15189857/what-is-the-most-efficient-way-to-empty-a-plain-object-in-javascript
// so `keyvalues={}` would create a new object and leave the original object as is,
// ie not garbage collected
let keyvalues = {} // keyvalue store for yaml code to use - use 'let' so yaml code can reset it?

export class AdapterDriver {
  //
  // initialize the client plugin
  // queries the device for address space definitions, subscribes to topics.
  init({ source, device, cache, module, provider }) {
    console.log('MQTT-subscriber initializing driver for', device.id)

    // IMPORTANT: types IS used - by the part(cache, $) fn evaluation
    const { types } = module // module is { inputs, outputs, types }, from yaml files

    // get selectors for each topic
    // eg from setup.yaml -
    // topics: # topics and selector objects - payload must match given contents
    //   controller: true
    //   l99/B01000/evt/io:
    //     id: 535172
    const topics = source.topics || {} // eg { controller, 'l99/B01000/evt/io' }
    console.log(`MQTT-subscriber get selectors from`, topics)
    const selectors = {} // key is topic, value will be selector fn
    for (let topic of Object.keys(topics)) {
      const value = topics[topic] // eg { id: 513241 }, or true, or false
      let selector = true // if setup lists a topic, assume it's to be included
      if (typeof value === 'boolean') {
        selector = value // true or false
      } else if (value.id !== undefined) {
        //. for now assume selection is done by id - expand to arbitrary objects later!
        // NOTE: we use == instead of ===, because payload.id may be a string
        selector = payload => payload.id == value.id
      }
      // selector can be t/f or a function of the message payload
      console.log(`MQTT-subscriber selector`, topic, String(selector), value)
      selectors[topic] = selector
    }

    // save topic handlers
    // iterate over message handlers - array of [topic, handler]
    // eg [['l99/ccs/evt/query', { unsubscribe, initialize, definitions, inputs, ... }], ...]
    this.topicHandlers = {}
    const handlers = module?.inputs?.handlers || {}
    for (let [topic, handler] of Object.entries(handlers)) {
      topic = replaceDeviceId(topic)
      this.topicHandlers[topic] = handler
    }

    // register connection handler
    provider.on('connect', function onConnect() {
      console.log(`MQTT-subscriber connected to MQTT-provider`)

      // subscribe to any topics defined in inputs.yaml
      const entries = module?.inputs?.connect?.subscribe || []
      for (const entry of entries) {
        const topic = replaceDeviceId(entry.topic)
        // can set a topic to false in setup.yaml to not subscribe to it
        const selector = selectors[topic]
        if (selector && selector !== false) {
          console.log(`MQTT-subscriber subscribing to ${topic}`)
          // mqtt.subscribe(topic) // old code
          // we extend the mqtt api to add callback and optional selector for dispatcher to filter on.
          // we need the callback because otherwise the provider wouldn't know where to send msg,
          // ie which of the many mqtt-subscriber instances to send to.
          // onMessage is defined below.
          provider.subscribe(topic, onMessage, selector)
        }
      }

      // publish to any topics defined
      const publish = module?.inputs?.connect?.publish || []
      for (const entry of publish) {
        const topic = replaceDeviceId(entry.topic)
        console.log(`MQTT-subscriber publishing to ${topic}`)
        provider.publish(topic, entry.message)
      }

      // do any static inits
      const inits = module?.inputs?.connect?.static || {} // eg { procname: KITTING }
      console.log('MQTT-subscriber static inits:', inits)
      for (const key of Object.keys(inits)) {
        const cacheId = `${device.id}-${key}`
        const value = inits[key]
        cache.set(cacheId, value)
      }

      console.log(`MQTT-subscriber listening for messages...`)
    })

    // handle incoming messages.
    // eg for ccs-pa have query, status, and read messages.
    // msgTopic - mqtt topic, eg 'l99/pa1/evt/query'
    // message - array of bytes (assumed to be a string or json string)
    // so we need to handle messages differently depending on the topic -
    // need a dict to dispatch on.
    //. currently does linear search through them - should be a dict
    function onMessage(topic, message) {
      // eg topic 'l99/ccs/evt/query'
      let handler = this.topicHandlers[topic]
      if (!handler) {
        console.log(`MQTT-subscriber warning: no handler for topic`, topic)
      } else {
        message = message.toString()
        // console.log(`MQTT-subscriber msg ${msgTopic}: ${message.slice(0, 140)}`)

        // unpack the mqtt json payload, assuming it's a JSON string -
        // if not, just pass as string to handler.
        //. let input.yaml do this if needed - ie with initialize method?
        let payload
        try {
          payload = JSON.parse(message)
        } catch (error) {
          console.log(error.message)
          payload = message
        }

        // unsubscribe from topics as needed
        for (const entry of handler.unsubscribe || []) {
          const topic = replaceDeviceId(entry.topic)
          console.log(`MQTT-subscriber unsubscribe from ${topic}`)
          provider.unsubscribe(topic, onMessage)
        }

        // run initialize handler
        // eg can assign payload values to a dictionary $ here for fast lookups.
        // eg initialize: 'payload.forEach(item => $[item.address] = item)'
        // eg initialize: '$ = payload; $.faultKeys=Object.keys(payload.faults);'
        // console.log(`MQTT-subscriber run initialize handler`)
        let $ = {} // a variable representing payload data - must be let not const
        eval(handler.initialize)

        //. call this handler.algorithm, update all modules
        //. call this iterate_expressions, update all module inputs.yaml
        if (handler.process === 'iterate_inputs') {
          //
          // console.log(`MQTT-subscriber handle iterate_inputs`)
          //
          // define lookup function
          // eg lookup: '($, js) => eval(js)'
          //. do this before-hand somewhere and store as handler.lookupFn,
          // to save eval time.
          // console.log(`MQTT-subscriber define lookup fn`, handler.lookup.toString())
          const lookup = eval(handler.lookup)

          // iterate over expressions - an array of [key, expression],
          // eg [['fault_count', '%M55.2'], ...].
          // evaluate each expression and add value to cache.
          //. this could be like the other process - use msg('foo'), calculations,
          // then would be reactive instead of evaluating each expression, and unifies code.
          // console.log(`MQTT-subscriber iterate over expressions`)
          const pairs = Object.entries(handler.expressions || {})
          for (const [key, expression] of pairs) {
            // use the lookup function to get value from payload, if there
            // console.log(`MQTT-subscriber lookup ${expression} for ${key}`)
            const value = lookup($, expression)
            // note guard for undefined value -
            // if need to reset a cache value, must pass value 'UNAVAILABLE' explicitly.
            if (value !== undefined) {
              const cacheId = device.id + '-' + key // eg 'pa1-fault_count'
              cache.set(cacheId, value) // save to the cache - may send shdr to agent
            }
          }
          //
        } else if (handler.process === 'iterate_message_contents') {
          //
          // get set of keys for eqns we need to execute based on the payload
          // eg set{'has_current_job', 'job_meta', ...}
          //. call this dependencies = getDependencies?
          //  or references = getReferences ?
          let equationKeys = getEquationKeys(payload, handler.maps)

          // make sure all '=' expressions will be evaluated
          lib.mergeIntoSet(equationKeys, handler.alwaysRun)

          let depth = 0

          do {
            const equationKeys2 = new Set()
            // evaluate each eqn once, and put the results in the cache.
            for (let equationKey of equationKeys) {
              const expression = handler.augmentedExpressions[equationKey]
              const value = expression.fn(cache, $, keyvalues) // run the expression fn
              if (value !== undefined) {
                const cacheId = device.id + '-' + equationKey // eg 'pa1-fault_count'
                cache.set(cacheId, value) // save to the cache - may send shdr to tcp
                equationKeys2.add(cacheId)
              }
            }
            equationKeys = getEquationKeys2(equationKeys2, handler.maps)
            depth += 1
          } while (equationKeys.size > 0 && depth < 6) // prevent endless loops
        } else {
          console.log(
            `MQTT-subscriber error missing handler.process`,
            handler.process
          )
        }

        // subscribe to any topics
        for (const entry of handler.subscribe || []) {
          const topic = replaceDeviceId(entry.topic)
          console.log(`MQTT-subscriber subscribe to ${topic}`)
          provider.subscribe(topic, onMessage, selectors[topic])
        }
      }
    }

    function replaceDeviceId(str) {
      return str.replace('${deviceId}', device.id)
    }
  }
}
