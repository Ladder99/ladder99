// feedback driver - watch for changes to a dataitem and send commands to device.

// currently used for monitoring jobboss job number and
// sending a part count reset to a device via mqtt.

// see client-oxbox/setup.yaml for an example of using this.

//. will this be replaced by MTConnect Interfaces eventually?

// import * as lib from '../common/lib.js'
// import * as foo from '../common/foo.js'
import { getSelector } from '../helpers.js'

// optional flag defined in .env.
// lets you turn on the feedback mechanism for a live/production device,
// but leave it off for a backup/development machine - otherwise they
// may interfere with each other.
const feedbackOn = process.env.L99_FEEDBACK

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
    this.command = feedback.command || {} // { topic, payload, values } for commands
    // the feedback command has null for address, so need to fill it in based on that specified in the source.
    this.payload = this.command.payload || { address: this.source.address } // eg { address, value, unitid, quantity, fc }
    this.values = this.command.values || [] // eg [5392, 0] the two values to send with commands
    this.wait = feedback.wait || {} // { topic, payload } topic and payload filter to wait on
    // the feedback wait payload has null for id, so need to fill it in based on that specified in the source.
    this.wait.payload = { ...this.wait.payload, id: this.source.id }

    // topic to wait on
    this.waitTopic = this.wait.topic

    // get wait selector boolean or fn for the payload object we're going to wait for
    this.waitSelector = getSelector(this.wait.payload)

    // bind callback to this instance so will always have same address for subscribing and unsubscribing
    this.waitCallback = this.feedbackCallback.bind(this)

    // check dataitem value - when changes, send reset cmd, wait for response, send 2nd cmd
    this.oldValue = null
    this.poll()
    setInterval(this.poll.bind(this), feedback.interval || 2000) // interval in ms
  }

  poll() {
    // check if dataitem value changed, then send reset commands (unless just starting up)
    const newValue = this.cache.get(this.dataitem) // eg 'm1-job'
    this.oldValue = this.oldValue || newValue // this will avoid firing all this off if just starting up, when oldValue=null
    if (newValue !== this.oldValue) {
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
      const { address } = this.source // { driver, connection, address, id }
      const commandTopic = this.command.topic
      const commandPayload = { ...this.payload, address, value: this.values[0] } // { address, value, unitid, quantity, fc }
      console.log(this.me, `publish`, commandTopic, commandPayload)
      this.provider.publish(commandTopic, JSON.toString(commandPayload))
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

    // const sentValue = payload[waitAttribute] // eg payload.a15
    console.log(this.me, `feedbackCallback response`, payload)

    // note: we use == because either might be a string, not number.
    // selector should have checked this already, but just in case.
    // if (sentValue == values[0]) {
    // publish the second command
    // const commandPayload = { ...this.payload, address, value: this.values[1] }
    const commandPayload = { ...this.payload, value: this.values[1] }
    this.provider.publish(commandTopic, JSON.toString(commandPayload))

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
