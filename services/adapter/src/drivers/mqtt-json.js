// mqtt-json driver
// subscribes to mqtt topics, receives messages,
// parses them out as JSON, updates cache values, which sends SHDR to agent.

import libmqtt from 'mqtt' // see https://www.npmjs.com/package/mqtt
// import { v4 as uuid } from 'uuid' // see https://github.com/uuidjs/uuid - may be used by inputs/outputs yaml js
import { getEquationKeys, getEquationKeys2 } from '../helpers.js'
import * as lib from '../common/lib.js'

//... move this into class
//. and make it a const - call it sthing else - data?
//. pass it into expression fns as this.data?
// then expressions could refer to it by eg `data.foo.bar = 3
// see https://stackoverflow.com/questions/15189857/what-is-the-most-efficient-way-to-empty-a-plain-object-in-javascript
// so `keyvalues={}` would create a new object and leave the original object as is,
// ie not garbage collected?
let keyvalues = {} // keyvalue store for yaml code to use - use 'let' so yaml code can reset it

export class AdapterDriver {
  //
  // initialize the client plugin
  // queries the device for address space definitions, subscribes to topics.
  // inputs is the inputs.yaml file parsed to a js tree.
  // note: types IS used - by the part(cache, $) fn evaluation
  // advice is a dict of optional fns that are called at various points in the code.
  //. is advice used also?
  init({ device, host, port, cache, inputs, types, advice }) {
    console.log('MQTT Initializing mqtt-json driver for', device.id)
    const url = `mqtt://${host}:${port}`

    // connect to mqtt broker/server
    console.log(`MQTT connecting to broker on ${url}...`)
    const mqtt = libmqtt.connect(url)

    // handle connection
    mqtt.on('connect', function onConnect() {
      console.log(`MQTT connected to broker on ${url}`)

      // register message handler
      console.log(`MQTT registering message handler`)
      mqtt.on('message', onMessage)

      // subscribe to any topics defined
      for (const entry of inputs.connect.subscribe) {
        const topic = replaceDeviceId(entry.topic)
        console.log(`MQTT subscribing to ${topic}`)
        mqtt.subscribe(topic)
      }

      // publish to any topics defined
      for (const entry of inputs.connect.publish || []) {
        const topic = replaceDeviceId(entry.topic)
        console.log(`MQTT publishing to ${topic}`)
        mqtt.publish(topic, entry.message)
      }

      // do any static inits
      console.log(inputs.connect.static)
      for (const key of Object.keys(inputs.connect.static || {})) {
        const cacheId = `${device.id}-${key}`
        const value = inputs.connect.static[key]
        cache.set(cacheId, value)
      }

      console.log(`MQTT listening for messages...`)
    })

    // handle incoming messages.
    // eg for ccs-pa have query, status, and read messages.
    // msgTopic - mqtt topic, eg 'l99/pa1/evt/query'
    // message - array of bytes (assumed to be a json string)
    function onMessage(msgTopic, message) {
      message = message.toString()
      console.log(`MQTT got message ${msgTopic}: ${message.slice(0, 140)}`)
      // console.log(`Got message on topic ${msgTopic}: ${message}`)

      // const receivedTime = new Date()

      // unpack the mqtt json payload, assuming it's a JSON string -
      // if not, just pass as string to handler.
      let payload
      try {
        payload = JSON.parse(message)
      } catch (error) {
        console.log(error.message)
        payload = message
      }

      //.................. very temporary stopgap while travelling ...................
      if (payload.id && payload.id !== '535172') return

      // iterate over message handlers - array of [topic, handler]
      // eg [['l99/ccs/evt/query', { unsubscribe, initialize, definitions, inputs, ... }], ...]
      let msgHandled = false
      for (let [topic, handler] of Object.entries(inputs.handlers)) {
        topic = replaceDeviceId(topic)

        // eg msgTopic => 'l99/ccs/evt/query'
        if (topic === msgTopic) {
          console.log(`MQTT handle topic ${topic}`)

          // unsubscribe from topics as needed
          for (const entry of handler.unsubscribe || []) {
            const topic = replaceDeviceId(entry.topic)
            console.log(`MQTT unsubscribe from ${topic}`)
            mqtt.unsubscribe(topic)
          }

          // run initialize handler
          // eg can assign payload values to a dictionary $ here for fast lookups.
          // eg initialize: 'payload.forEach(item => $[item.address] = item)'
          // eg initialize: '$ = payload; $.faultKeys=Object.keys(payload.faults);'
          console.log(`MQTT run initialize handler`)
          let $ = {} // a variable representing payload data - must be let not const
          eval(handler.initialize)

          //. call this iterate_expressions
          if (handler.process === 'iterate_inputs') {
            console.log(`MQTT handle iterate_inputs`)
            //
            // define lookup function
            // eg lookup: '($, js) => eval(js)'
            //. do this before-hand somewhere and store as handler.lookupFn,
            // to save eval time.
            console.log(`MQTT define lookup fn`, handler.lookup.toString())
            const lookup = eval(handler.lookup)

            // iterate over expressions - an array of [key, expression],
            // eg [['fault_count', '%M55.2'], ...].
            // evaluate each expression and add value to cache.
            //. this could be like the other process - use msg('foo'), calculations,
            // then would be reactive instead of evaluating each expression, and unifies code.
            console.log(`MQTT iterate over expressions`)
            const pairs = Object.entries(handler.expressions || {})
            for (const [key, expression] of pairs) {
              // use the lookup function to get value from payload, if there
              console.log(`MQTT lookup ${expression} for ${key}`)
              const value = lookup($, expression)
              // note guard for undefined value -
              // if need to reset a cache value, must pass value 'UNAVAILABLE' explicitly.
              if (value !== undefined) {
                const cacheId = device.id + '-' + key // eg 'pa1-fault_count'
                cache.set(cacheId, value) // save to the cache - may send shdr to agent
              }
            }
          } else if (handler.process === 'iterate_message_contents') {
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
            // ie handler.process = 'text_message'

            let equationKeys = new Set(['connection'])

            for (let equationKey of equationKeys) {
              const expression = handler.augmentedExpressions[equationKey]
              const value = expression.fn(cache, $, keyvalues) // run the expression fn
              if (value !== undefined) {
                const cacheId = device.id + '-' + equationKey // eg 'pa1-fault_count'
                cache.set(cacheId, value) // save to the cache - may send shdr to tcp
                // equationKeys2.add(cacheId)
              }
            }
          }

          // subscribe to any topics
          for (const entry of handler.subscribe || []) {
            const topic = replaceDeviceId(entry.topic)
            console.log(`MQTT subscribe to ${topic}`)
            mqtt.subscribe(topic)
          }

          msgHandled = true
        }
      }

      if (!msgHandled) {
        console.log(`MQTT WARNING: no handler for topic`, msgTopic)
      }
    }

    //.
    function replaceDeviceId(str) {
      return str.replace('${deviceId}', device.id)
    }
  }
}
