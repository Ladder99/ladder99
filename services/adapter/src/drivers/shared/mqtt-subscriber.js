// shared/mqtt-json driver
// subscribes to mqtt topics through shared provider, receives messages,
// parses them out as JSON, updates cache values, which sends SHDR to agent.

// this file is a copy of drivers/mqtt-json.js - would be nice to merge them together if possible.

// import libmqtt from 'mqtt' // see https://www.npmjs.com/package/mqtt
import { getEquationKeys, getEquationKeys2 } from '../../helpers.js'
import * as lib from '../../common/lib.js'
import { getMqtt } from './mqtt-provider.js'

//. move this into class
//. and make it a const - call it sthing else - data?
//. pass it into expression fns as this.data?
// then expressions could refer to it by eg `data.foo.bar = 3`
// see https://stackoverflow.com/questions/15189857/what-is-the-most-efficient-way-to-empty-a-plain-object-in-javascript
// so `keyvalues={}` would create a new object and leave the original object as is,
// ie not garbage collected?
let keyvalues = {} // keyvalue store for yaml code to use - use 'let' so yaml code can reset it

export class AdapterDriver {
  //
  // initialize the client plugin
  // queries the device for address space definitions, subscribes to topics.
  // inputs is the inputs.yaml file parsed to a js tree.
  // advice is a dict of optional fns that are called at various points in the code.
  //. is advice used also?
  // IMPORTANT: types IS used - by the part(cache, $) fn evaluation
  init({ source, device, host, port, cache, inputs, types, advice }) {
    console.log('MQTT-subscriber initializing driver for', device.id)
    const url = `mqtt://${host}:${port}`

    // connect to mqtt broker/server
    console.log(`MQTT-subscriber getting MQTT-provider singleton...`)
    // const mqtt = libmqtt.connect(url)
    //. our mqtt object has same api as libmqtt's object, just extended a little bit.
    const mqtt = getMqtt(url) // get singleton libmqtt object, but don't try to connect yet

    // get selectors for each topic
    // eg from setup.yaml -
    // topicSelectors: # topics and selector objects - payload must match given contents
    //   l99/B01000/evt/io:
    //     id: 535172
    //   l99/B01000/evt/vibration:
    //     id: 479055
    //   l99/B01000/evt/pressure:
    //     id: 541790
    const selectors = {} // key is topic, value will be selector fn
    for (let topic of Object.keys(source.topicSelectors)) {
      const obj = source.topicSelectors[topic]
      const selector = payload => payload.id === obj.id //. for now assume selection is done by id
      selectors[topic] = selector
    }

    // handle connection
    mqtt.on('connect', function onConnect() {
      console.log(`MQTT-subscriber connected to MQTT-provider`)

      // register message handler
      console.log(`MQTT-subscriber registering message handler`)
      mqtt.on('message', onMessage) // callback fn takes topic and payload

      // subscribe to any topics defined in inputs.yaml
      for (const entry of inputs.connect.subscribe) {
        const topic = replaceDeviceId(entry.topic)
        console.log(`MQTT-subscriber subscribing to ${topic}`)
        // mqtt.subscribe(topic) // old code
        // extend mqtt api to add callback and optional selector for dispatcher to filter on.
        // we need the callback because otherwise our mqtt provider wouldn't know where to send msg.
        mqtt.subscribe(topic, onMessage, selectors[topic])
      }

      // publish to any topics defined
      for (const entry of inputs.connect.publish || []) {
        const topic = replaceDeviceId(entry.topic)
        console.log(`MQTT-subscriber publishing to ${topic}`)
        mqtt.publish(topic, entry.message)
      }

      // do any static inits
      console.log('MQTT-subscriber static inits:', inputs.connect.static)
      for (const key of Object.keys(inputs.connect.static || {})) {
        const cacheId = `${device.id}-${key}`
        const value = inputs.connect.static[key]
        cache.set(cacheId, value)
      }

      console.log(`MQTT-subscriber listening for messages...`)
    })

    // now connect
    mqtt.start()

    // handle incoming messages.
    // eg for ccs-pa have query, status, and read messages.
    // msgTopic - mqtt topic, eg 'l99/pa1/evt/query'
    // message - array of bytes (assumed to be a string or json string)
    //. so we need to handle messages differently depending on the topic -
    // need a dict to dispatch on - currently does linear search through them.
    function onMessage(msgTopic, message) {
      message = message.toString()

      // //. temporary guard
      // if (msgTopic === 'controller')
      //   console.log(`MQTT-subscriber got message ${msgTopic}: ${message.slice(0, 140)}`)
      // // console.log(`Got message on topic ${msgTopic}: ${message}`)

      // unpack the mqtt json payload, assuming it's a JSON string -
      // if not, just pass as string to handler.
      //. let input.yaml do this if needed
      let payload
      try {
        payload = JSON.parse(message)
      } catch (error) {
        console.log(error.message)
        payload = message
      }

      // iterate over message handlers - array of [topic, handler]
      // eg [['l99/ccs/evt/query', { unsubscribe, initialize, definitions, inputs, ... }], ...]
      //. better to have a dict to lookup topic handler -
      //. ie const handler = inputs.handlers[msgTopic]
      let msgHandled = false
      for (let [topic, handler] of Object.entries(inputs.handlers)) {
        topic = replaceDeviceId(topic)

        // eg msgTopic => 'l99/ccs/evt/query'
        if (topic === msgTopic) {
          //
          // console.log(`MQTT-subscriber handle topic ${topic}`)

          // unsubscribe from topics as needed
          for (const entry of handler.unsubscribe || []) {
            const topic = replaceDeviceId(entry.topic)
            console.log(`MQTT-subscriber unsubscribe from ${topic}`)
            mqtt.unsubscribe(topic) //. pass onMessage fn
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
            //
            // } else if (handler.process === 'text_message') {
            //   //
            //   //. this is hardcoded at the moment to a 'connection' string
            //   let equationKeys = new Set(['connection']) //. should get this from inputs.yaml

            //   // note: the variable '$' should have been set to the value of the variable payload with
            //   //   initialize: '$ = payload'
            //   // expression should be like
            //   //   connection: $
            //   // so `expression.fn(cache, $, keyvalues)` below just evals to $

            //   for (let equationKey of equationKeys) {
            //     const expression = handler.augmentedExpressions[equationKey]
            //     const value = expression.fn(cache, $, keyvalues) // run the expression fn
            //     console.log(`MQTT handle text_message`, topic, equationKey, value)
            //     if (value !== undefined) {
            //       const cacheId = device.id + '-' + equationKey // eg 'pa1-fault_count'
            //       cache.set(cacheId, value) // save to the cache - may send shdr to tcp
            //       // equationKeys2.add(cacheId)
            //     }
            //   }
            //   //
          } else {
            console.log(
              `MQTT-subscriber Error - missing handler.process`,
              handler.process
            )
          }

          // subscribe to any topics
          for (const entry of handler.subscribe || []) {
            const topic = replaceDeviceId(entry.topic)
            console.log(`MQTT-subscriber subscribe to ${topic}`)
            mqtt.subscribe(topic) //. add selector?
          }

          msgHandled = true
        }
      }

      if (!msgHandled) {
        console.log(`MQTT-subscriber WARNING: no handler for topic`, msgTopic)
      }
    }

    //.
    function replaceDeviceId(str) {
      return str.replace('${deviceId}', device.id)
    }
  }
}
