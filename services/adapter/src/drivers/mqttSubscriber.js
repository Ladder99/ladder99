// MqttSubscriber driver

// subscribes to mqtt topics through shared mqttProvider, receives messages,
// parses them out as JSON, updates cache values, which sends SHDR to agent.

//. refactor/chop this code up into smaller fns - hard to read.
// be careful with types, keyvalues, closure vars, and this vs this.

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
    this.device = device
    this.cache = cache
    this.module = module // { inputs, outputs, types }
    this.provider = provider

    // IMPORTANT: types IS used - by the part(cache, $) fn evaluation
    this.types = module.types // module is { inputs, outputs, types }, from yaml files

    // keyvalue store for yaml code to use
    this.keyvalues = {}

    // get dict of selector fns for each topic
    // eg { 'controller': true, 'l99...': payload=>payload.id==535172, ... }
    this.selectors = this.getSelectors()

    // get topic handlers from inputs.yaml
    // eg { 'controller': { unsubscribe, initialize, definitions, inputs, ... }, ... }
    this.topicHandlers = this.getTopicHandlers()

    // register connection handler
    this.provider.on('connect', this.onConnect.bind(this))
  }

  // provider connected to broker
  onConnect() {
    console.log(this.me, `connected to MqttProvider`)
    this.subscribeTopics() // subscribe to any topics defined in inputs.yaml
    this.publishTopics() // publish to any topics defined
    this.doStaticInits() // do any static inits
    console.log(this.me, `listening for messages...`)
  }

  // subscribe to topics as defined in inputs.yaml
  // eg [{topic:'controller'}, {topic:'l99/B01000/evt/io'}, ...]
  subscribeTopics() {
    const subscriptions = this.module.inputs?.connect?.subscribe || []
    const topics = subscriptions.map(subscription => subscription.topic)
    console.log(this.me, 'subscribe', topics)
    for (const subscription of subscriptions) {
      const topic = this.replaceDeviceId(subscription.topic)
      // can set a topic to false in setup.yaml to not subscribe to it
      const selector = this.selectors[topic]
      if (selector && selector !== false) {
        console.log(this.me, `subscribing to ${topic}`)
        // we extend the mqtt api to add callback and optional selector for dispatcher to filter on.
        // we need the callback because otherwise the provider wouldn't know where to send msg,
        // ie which of the many MqttSubscriber instances to send to.
        // onMessage is defined below.
        // mqtt.subscribe(topic) // old code using libmqtt
        this.provider.subscribe(topic, this.onMessage.bind(this), selector) //. ok with unsubscribe?
      }
    }
  }

  // publish to topics as defined in inputs.yaml
  publishTopics() {
    const publish = this.module.inputs?.connect?.publish || [] // list of { topic, message }
    for (const entry of publish) {
      const topic = this.replaceDeviceId(entry.topic)
      console.log(this.me, `publishing to ${topic}`)
      this.provider.publish(topic, entry.message)
    }
  }

  // do any static inits as defined in inputs.yaml
  doStaticInits() {
    const inits = this.module.inputs?.connect?.static || {} // eg { procname: KITTING }
    console.log(this.me, 'static inits:', inits)
    for (const key of Object.keys(inits)) {
      const cacheId = `${device.id}-${key}`
      const value = inits[key]
      this.cache.set(cacheId, value)
    }
  }

  // handle incoming messages
  // eg for ccs-pa have query, status, and read messages.
  // topic - mqtt topic, eg 'l99/pa1/evt/query'
  // message - array of bytes (assumed to be a string or json string)
  onMessage(topic, payload) {
    const handler = this.topicHandlers[topic]
    if (!handler) {
      console.log(this.me, `warning: no handler for topic`, topic)
      return
    }
    payload = payload.toString() // bytes to string
    //.
    if (topic === 'controller') {
      console.log(this.me, `msg ${topic}: ${payload.slice(0, 140)}`)
    }

    // if payload is plain text, set handler.text true in inputs.yaml - else parse as json
    if (!handler.text) payload = JSON.parse(payload) // string to js object

    // unsubscribe from any topics specified
    this.unsubscribeTopics(handler)

    // make these available to yaml code
    const types = this.types
    const keyvalues = this.keyvalues

    // run initialize handler
    // eg can assign payload values to a dictionary $ here for fast lookups.
    // eg initialize: 'payload.forEach(item => $[item.address] = item)'
    // eg initialize: '$ = payload; $.faultKeys=Object.keys(payload.faults);'
    //. parameterize this so don't need to put code in the yaml
    // console.log(this.me,`run initialize handler`)
    let $ = {} // a variable representing payload data - must be let not const
    eval(handler.initialize) // eg '$ = payload' - ie sets the variable `$` to message payload (string or js object)

    // run algorithm handler on the payload
    const algorithm = handler.algorithm || 'none'
    const algorithmHandlers = {
      iterate_expressions: iterateExpressions, //. call this 'eval_expressions'
      iterate_message_contents: iteratePayloadContents,
      none: noAlgorithm,
    }
    const algorithmHandler = (
      algorithmHandlers[algorithm] || unknownAlgorithm
    ).bind(this)
    algorithmHandler() // call the algorithm handler - local functions defined below

    // subscribe to any additional topics as specified
    this.subscribeTopics2(handler)

    // this algorithm iterates over expressions, evaluates each, and adds value to cache.
    // expressions is an array of [key, expression] - eg [['fault_count', '%M55.2'], ...].
    //. this could be like the other algorithm - use msg('foo'), calculations -
    // then would be reactive instead of evaluating each expression, and unifies code!
    function iterateExpressions() {
      const expressions = handler.expressions || {}
      for (const [key, expression] of Object.entries(expressions)) {
        // use the lookup function to get value from payload
        const lookupFn = eval(handler.lookup) // eg '($, js) => eval(js)' - convert string to a fn
        const value = lookupFn($, expression) // eg expression=`dxm: $==='birth'` -> value=true
        // note guard for undefined value.
        // if need to reset a cache value, must pass value 'UNAVAILABLE' explicitly.
        if (value !== undefined) {
          const cacheId = this.device.id + '-' + key // eg 'pa1-fault_count'
          this.cache.set(cacheId, value)
        }
      }
    }

    // get set of keys for eqns we need to execute based on the payload
    // eg set{'has_current_job', 'job_meta', ...}
    function iteratePayloadContents() {
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
          //. should we be passing keyvalues here? does it get stuck in the closure?
          const value = expression.fn(cache, $, keyvalues) // run the expression fn
          if (value !== undefined) {
            const cacheId = this.device.id + '-' + equationKey // eg 'pa1-fault_count'
            this.cache.set(cacheId, value) // save to the cache - may send shdr to tcp
            equationKeys2.add(cacheId)
          }
        }
        //. merge this algorithm with getEquationKeys
        equationKeys = getEquationKeys2(equationKeys2, handler.maps)
        depth += 1
      } while (equationKeys.size > 0 && depth < 6)
    }

    function unknownAlgorithm() {
      console.log(this.me, `error unknown algorithm ${handler.algorithm}`)
    }

    function noAlgorithm() {
      console.log(this.me, `error no algorithm set for ${topic}`)
    }
  } // end of onMessage fn

  // subscribe to any topics as specified in inputs.yaml
  subscribeTopics2(handler) {
    for (const entry of handler.subscribe || []) {
      const topic = this.replaceDeviceId(entry.topic)
      console.log(this.me, `subscribe to ${topic}`)
      this.provider.subscribe(
        topic,
        this.onMessage.bind(this),
        selectors[topic]
      )
    }
  }

  // unsubscribe from any topics as specified in inputs.yaml
  unsubscribeTopics(handler) {
    for (const entry of handler.unsubscribe || []) {
      const topic = this.replaceDeviceId(entry.topic)
      console.log(this.me, `unsubscribe from ${topic}`)
      this.provider.unsubscribe(topic, this.onMessage.bind(this))
    }
  }

  // get dict of topic handlers - one handler per topic
  getTopicHandlers() {
    const topicHandlers = {}
    const handlers = this.module.inputs?.handlers || {}
    for (let [topic, handler] of Object.entries(handlers)) {
      topic = this.replaceDeviceId(topic)
      topicHandlers[topic] = handler
    }
    return topicHandlers
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
        `got selector for topic ${topic}, ${String(selector)}, with value`,
        value
      )
      selectors[topic] = selector
    }
    return selectors
  }

  replaceDeviceId(str) {
    return str.replace('${deviceId}', this.device.id)
  }
}
