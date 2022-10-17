// feedback driver - watch for changes to a dataitem in the cache,
// and send commands to device.

// currently used for monitoring jobboss job number and
// sending a part count reset to a device via mqtt.

// see client-oxbox/setup.yaml for an example of using this.

//. will this be replaced by MTConnect Interfaces eventually?

import { getSelector } from '../helpers.js'

// optional flag defined in .env.
// lets you turn on the feedback mechanism for a live/production device,
// but leave it off for a backup/development machine - otherwise they
// may interfere with each other.
const feedbackOn = process.env.L99_FEEDBACK

const feedbackIntervalDefault = 2000 // ms

// ignore transitions from these values
const ignoreValuesDefault = ['NONE', 'UNAVAILABLE']

export class AdapterDriver {
  //
  // setup is the parsed setup.yaml tree
  // source is the source tree from the setup.yaml for this device
  start({ setup, source, device, cache, provider }) {
    this.me = `Feedback ${device.name}:`

    console.log(this.me, `L99_FEEDBACK =`, feedbackOn)
    if (!feedbackOn) return

    console.log(this.me, `start driver, source`, source)

    this.cache = cache // need for monitoring a value
    this.source = source // { driver }
    this.provider = provider // eg the mqttProvider.js object

    // get base config, if there
    const feedback = setup.adapter?.drivers?.feedback || {}
    this.dataitem = device.id + '-' + feedback.dataitem // dataitem to watch - eg 'm1-job'
    const interval = feedback.interval || feedbackIntervalDefault // ms

    // command params
    this.command = feedback.command || {} // { topic, payload, values } for commands
    this.payload = { ...this.command.payload, address: this.source.address } // eg { address, value, unitid, quantity, fc }
    this.values = this.command.values || [] // eg [5392, 0] the two values to send with commands
    this.ignoreValues = feedback.ignoreValues ?? ignoreValuesDefault // eg ['NONE', 'UNAVAILABLE']

    // wait params
    this.wait = feedback.wait || {} // { topic, payload } topic and payload filter to wait on
    this.waitTopic = this.wait.topic
    this.waitPayload = { ...this.wait.payload, id: this.source.id }
    this.waitSelector = getSelector(this.waitPayload) // selector fn
    this.waitCallback = this.feedbackCallback.bind(this) // put this here to always have same fn address for subscribing and unsubscribing

    // check dataitem value - when changes, send reset cmd, wait for response, send 2nd cmd
    this.oldValue = null
    this.poll()
    setInterval(this.poll.bind(this), interval)
  }

  poll() {
    // check if dataitem value changed, then send reset commands
    // (unless just starting up, or changing from NONE)
    const newValue = this.cache.get(this.dataitem) // eg 'm1-job'
    this.oldValue = this.oldValue ?? newValue // this will avoid firing all this off if just starting up, when oldValue=null
    // if (newValue !== this.oldValue && this.oldValue !== 'NONE') {
    if (
      newValue !== this.oldValue &&
      !this.ignoreValues.includes(this.oldValue)
    ) {
      console.log(this.me, `value changed from ${this.oldValue} to ${newValue}`)

      // send command, wait for response, send second command

      // subscribe to wait topic
      // will subscribe to mqttProvider with dispatch based on payload.id and waitAttribute value
      // sendLastMessage false so doesn't call the callback if topic already registered
      this.provider.subscribe(
        this.waitTopic,
        this.waitCallback,
        this.waitSelector,
        false
      )

      // publish to command topic
      const commandPayload = { ...this.payload, value: this.values[0] } // { address, value, unitid, quantity, fc }
      console.log(this.me, `publish`, this.command.topic, commandPayload)
      this.provider.publish(this.command.topic, JSON.stringify(commandPayload)) // bug: had JSON.toString(), which makes '[object Object]'
      this.oldValue = newValue

      // q. what if a response never comes? timeout after a minute?
      // well, it's okay - we check for duplicate subscriptions, so they won't clog the system.
    }
  }

  // callback for wait topic
  // payload is eg { id: 535172, a15: 5392, ... }
  feedbackCallback(topic, payload) {
    payload = payload.toString()
    payload = JSON.parse(payload)

    console.log(this.me, `feedbackCallback response`, payload)

    // note: we use == because either might be a string or number.
    // selector should have checked this already, but just in case.
    // const sentValue = payload[waitAttribute] // eg payload.a15
    // if (sentValue == values[0]) {

    // publish the second command
    const commandPayload = { ...this.payload, value: this.values[1] }
    console.log(this.me, `publish`, this.command.topic, commandPayload)
    this.provider.publish(this.command.topic, JSON.stringify(commandPayload)) // bug: had JSON.toString(), which makes '[object Object]'

    // unsubscribe from the wait topic
    this.provider.unsubscribe(
      this.waitTopic,
      this.waitCallback,
      this.waitSelector
    )

    // } else {
    //   console.log(this.me, `error feedbackCallback got wrong value`, sentValue)
    // }
  }
}
