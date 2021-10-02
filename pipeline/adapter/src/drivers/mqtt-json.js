// mqtt-json driver
// subscribes to mqtt topics, receives messages,
// parses them out as JSON, updates cache values, which sends SHDR to agent.

import libmqtt from 'mqtt' // see https://www.npmjs.com/package/mqtt
import { v4 as uuid } from 'uuid' // see https://github.com/uuidjs/uuid - may be used by inputs/outputs yaml js
import { getEquationKeys, getEquationKeys2 } from '../helpers.js'

// let cycleStart
//... move this into class
//.. and make it a const - call it sthing else - data?
// yamls could refer to it by `this.data.foo.bar = 3
// see https://stackoverflow.com/questions/15189857/what-is-the-most-efficient-way-to-empty-a-plain-object-in-javascript
// so `keyvalues={}` would create a new object and leave the original object as is,
// ie not garbage collected.
let keyvalues = {} // keyvalue store for yaml code to use - use 'let' so yaml code can reset it

export class AdapterDriver {
  // initialize the client plugin
  // queries the device for address space definitions, subscribes to topics.
  // inputs is the inputs.yaml file parsed to a js tree.
  // note: types IS used - by the part(cache, $) fn evaluation
  // advice is a dict of optional fns that are called at various points in the code.
  init({ deviceId, deviceName, host, port, cache, inputs, types, advice }) {
    console.log('Initializing mqtt-json driver for', { deviceId })
    const url = `mqtt://${host}:${port}`

    // //. parse input handler code, get dependency graph, compile fns
    // // eg maps could be { addr: { '%Z61.0': Set(1) { 'has_current_job' } }, ...}
    // // use like
    // //   const addr = '%Z61.0'
    // //   const keys = [...maps.addr[addr]] // = ['has_current_job']
    // // so can know what formulas need to be evaluated for some given addr
    // const prefix = deviceId + '-'
    // const macros = getMacros(prefix, 'default')
    // const { augmentedInputs, maps } = compileInputs(inputs, macros)

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
      for (const entry of inputs.connect.publish) {
        const topic = replaceDeviceId(entry.topic)
        console.log(`MQTT publishing to ${topic}`)
        mqtt.publish(topic, entry.message)
      }

      // do any static inits
      console.log(inputs.connect.static)
      for (const key of Object.keys(inputs.connect.static || {})) {
        const cacheId = `${deviceId}-${key}`
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
      console.log(`Got message on topic ${msgTopic}: ${message.slice(0, 99)}`)
      // console.log(`Got message on topic ${msgTopic}: ${message}`)

      const receivedTime = new Date()

      // unpack the mqtt json payload, assuming it's a JSON string.
      // sets payload as variable - used by handler.initialize
      const payload = JSON.parse(message)

      // iterate over message handlers - handlerEntries is an array of [topic, handler]
      // eg ['l99/ccs/evt/query', { unsubscribe, initialize, definitions, inputs, ... }]
      // const handlerEntries = Object.entries(inputs.handlers) || []
      let msgHandled = false
      // handlerEntries.forEach(([topic, handler]) => {
      for (let [topic, handler] of Object.entries(inputs.handlers)) {
        topic = replaceDeviceId(topic)

        // eg msgTopic => 'l99/pa1/evt/query'
        if (topic === msgTopic) {
          // unsubscribe from topics as needed
          for (const entry of handler.unsubscribe || []) {
            const topic = replaceDeviceId(entry.topic)
            console.log(`MQTT unsubscribe from ${topic}`)
            mqtt.unsubscribe(topic)
          }

          // run initialize handler
          // eg can assign payload values to a dictionary $ here for fast lookups.
          // eg initialize: 'payload.forEach(item => $[item.keys[0]] = item)'
          console.log(`MQTT initialize handler`)
          let $ = {} // a variable representing payload data
          eval(handler.initialize)
          // console.log($)

          // // define lookup function
          // // eg lookup: '($, part) => ($[part] || {}).default'
          // console.log(`MQTT define lookup function`, handler.lookup.toString())
          // const lookup = eval(handler.lookup)

          // // call optional custom code
          // if (handler.advice && advice.inputs) {
          //   console.log(`Calling advice.inputs...`)
          //   advice.inputs({ $, lookup })
          // }

          if (handler.process === 'iterate_inputs') {
            // define lookup function
            //. should do this before-hand somewhere - store .lookupFn
            // eg lookup: '($, part) => ($[part] || {}).default'
            console.log(`MQTT define lookup`, handler.lookup.toString())
            const lookup = eval(handler.lookup)

            // iterate over inputs - an array of [key, part], eg ['fault_count', '%M55.2'].
            // if part is in payload, add it to the cache.
            console.log(`MQTT iterate over inputs`)
            for (const [key, part] of Object.entries(handler.inputs || {})) {
              const cacheId = deviceId + '-' + key // eg 'pa1-fault_count'
              // // const { code, value: valueFn } =
              // const value = fn(cache, $, keyvalues) // may use `types` dict also
              // console.log(`Got ${value} - set ${cacheId}...`)
              // // cache.set(cacheId, { value }) // save value to cache - may send shdr to tcp
              // cache.set(cacheId, value) // save value to cache - may send shdr to tcp
              // // } else {
              // const item = lookup($, part)
              // use the lookup function to get value from payload, if there
              // console.log(`calling lookup with $,part`, $, part)
              const value = lookup($, part)
              // console.log(`got value`, value)
              // if we have the part in the payload, add it to the cache
              //. why do we have a guard here for undefined? what if need to reset a cache value?
              //  i guess you'd have to pass item.value = 'UNAVAILABLE' explicitly?
              // if (item && item.value !== undefined) {
              if (value !== undefined) {
                console.log(`MQTT part '${part}' in payload - set ${cacheId}`)
                // item.receivedTime = receivedTime
                // cache.set(cacheId, item) // save to the cache - may send shdr to tcp
                cache.set(cacheId, value) // save to the cache - may send shdr to tcp
              }
            }
          } else {
            // ie process = 'iterate_message_contents'

            console.log('payload', payload)
            console.log('maps', handler.maps)

            // get set of keys for eqns we need to execute based on the payload
            // eg set{'has_current_job', 'job_meta', ...}
            let equationKeys = getEquationKeys(payload, handler.maps)

            let depth = 0

            do {
              console.log('depth', depth)
              console.log('eqnkeys', equationKeys)
              const equationKeys2 = new Set()
              // evaluate each eqn once, and put the results in the cache.
              for (let equationKey of equationKeys) {
                const input = handler.augmentedInputs[equationKey]
                console.log('input.fn', input.fn.toString())
                const value = input.fn(cache, $, keyvalues) // run the input fn
                console.log('input.fn()', value)
                if (value !== undefined) {
                  const cacheId = deviceId + '-' + equationKey // eg 'pa1-fault_count'
                  cache.set(cacheId, value) // save to the cache - may send shdr to tcp
                  equationKeys2.add(cacheId)
                }
              }
              equationKeys = getEquationKeys2(equationKeys2, handler.maps)
              depth += 1
            } while (equationKeys.size > 0 && depth < 4)
          }

          // console.log('cache', cache._map) // print contents of cache
          // console.log('keyvalues', keyvalues)

          // // check for step transitions to get timing info
          // //. genericize this, or let user write code
          // //. use message time, not new Date()
          // if (topic.includes('status')) {
          //   const step = payload.step
          //   if (step === 'Waiting') {
          //     // nothing
          //   } else if (step === 'Cycle_Start') {
          //     cycleStart = new Date().getTime() // ms
          //   } else if (step === 'Cycle_Finish') {
          //     if (cycleStart) {
          //       const cycleTime = (new Date().getTime() - cycleStart) / 1000 // sec
          //       // cache.set(`${deviceId}/status-cycle_time`, { value: cycleTime }) // sec
          //       // cache.set(`${deviceId}_status-cycle_time`, { value: cycleTime }) // sec
          //       cache.set(`${deviceId}-status_cycle_time`, { value: cycleTime }) // sec
          //       cycleStart = null
          //     }
          //   }
          // }

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

    function replaceDeviceId(str) {
      return str.replace('${deviceId}', deviceId)
    }
  }
}

// function compileInputs(inputs, deviceId) {
//   const prefix = deviceId + '-'
//   for (let handler of inputs.handlers) {
//     const keys = Object.keys(handler.inputs)
//     for (let key of keys) {
//       const part = handler.inputs[key]
//       const code = part.slice(1)
//       const { js, refs } = compile(code, prefix)
//       const fn1 = eval(js)
//     }
//   }
// }
