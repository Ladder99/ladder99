// feedback driver - watch for changes to a dataitem and send commands to device.

// currently used for monitoring jobboss job number and
// sending a part count reset to a device via mqtt.

// see client-oxbox/setup.yaml for an example of using this.

//. will this be replaced by MTConnect Interfaces eventually?

// import * as lib from '../common/lib.js'
import * as foo from '../common/foo.js'

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
    this.publish = feedback.publish || {} // { topic, payload, values } for commands
    this.payload = this.publish.payload || {} // eg { address, value, unitid, quantity, fc }
    this.values = this.publish.values || [] // eg [5392, 0] the two values to send with commands
    this.wait = feedback.wait || {} // { topic, payload } topic and payload filter to wait on

    // const waitAttribute = this.wait.attribute // eg 'a15'

    // this.waitSelector = {
    //   filter: payload =>
    //     payload.id == source.id && payload.a15 == this.values[0],
    //   equal: payload => this.filter(payload) && payload.length === 2,
    // }

    // // filter by fn - faster than generic object comparison
    // //. wrap selector in the closure?
    // const waitFilter = payload =>
    //   payload.id == selector.id &&
    //   payload[waitAttribute] == selector[waitAttribute]
    // // mqttProvider will use this to prevent duplicate subscriptions, and for unsubscribing
    // // const waitEqual = payload => waitFilter(payload) && payload.length === 2
    // const waitEqual = (subscriber1, subscriber2) =>
    //   subscriber1.callback.name === subscriber2.callback.name &&
    //   subscriber1.selector.id === subscriber2.selector.id &&
    //   subscriber1.selector[waitAttribute] ===
    //     subscriber2.selector[waitAttribute]

    // const waitFilter = getFilterFn(this.wait.payload)
    // const waitEqual = getEqualFn(this.wait.payload)
    //.

    // // filter by fn - faster than generic object comparison
    // //. could wrap selector in the closure
    // const waitFilter = payload =>
    //   payload.id == selector.id &&
    //   payload[waitAttribute] == selector[waitAttribute]

    // // mqttProvider will use this to prevent duplicate subscriptions, and for unsubscribing the right fn instance.
    // const waitEqual = (subscriber1, subscriber2) =>
    //   subscriber1.callback.name === subscriber2.callback.name &&
    //   subscriber1.selector.id === subscriber2.selector.id &&
    //   subscriber1.selector[waitAttribute] ===
    //     subscriber2.selector[waitAttribute]

    // get a wait selector { filter, equal } for the payload object we're going to wait for
    this.waitSelector = foo.getSelector(this.wait.payload)

    // publish:
    // topic: l99/B01000/cmd/modbus # mqtt topic to send commands to
    // payload:
    //   address: null # varies by device, eg 142
    //   value: null # will send values[0], wait, then values[1]
    //   unitid: 199
    //   quantity: 1
    //   fc: 6
    // values: [5392, 0] # values for payload.value - matches wait.payload.a15 below

    this.publish = 0

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

      const values = this.values // eg [5392, 0]

      // subscribe to response topic
      // will subscribe to mqttProvider with dispatch based on payload.id and waitAttribute value
      const waitTopic = this.wait.topic
      const waitCallback = feedbackCallback.bind(this)

      // this worked, but was too slow
      // const waitSelector = { id: this.source.id, [waitAttribute]: values[0] } // filter by example

      // subscribe to wait topic
      // this.provider.subscribe(waitTopic, waitCallback, waitSelector, false)
      // sendLastMessage false so doesn't call the callback if topic already registered
      this.provider.subscribe(waitTopic, waitCallback, this.waitSelector, false)

      // publish to command topic
      const { address } = this.source // { driver, connection, address, id }
      const commandTopic = this.command.topic
      const commandPayload = { ...this.payload, address, value: values[0] } // { address, value, unitid, quantity, fc }
      console.log(this.me, `publish`, commandTopic, commandPayload)
      this.provider.publish(commandTopic, JSON.toString(commandPayload))
      this.oldValue = newValue

      // q. what if a response never comes? timeout after a minute?
      // well, it's okay - we check for duplicate subscriptions, so they won't clog the system.

      // callback for wait topic
      function feedbackCallback(topic, payload) {
        payload = payload.toString()
        payload = JSON.parse(payload)

        const sentValue = payload[waitAttribute] // eg payload.a15
        console.log(this.me, `feedbackCallback response`, payload, sentValue)

        // note: we use == because either might be a string, not number.
        // selector should have checked this already, but just in case.
        if (sentValue == values[0]) {
          // publish the second command
          const commandPayload = { ...this.payload, address, value: values[1] }
          this.provider.publish(commandTopic, JSON.toString(commandPayload))

          // unsubscribe from the wait topic
          // this.provider.unsubscribe(waitTopic, waitCallback, waitSelector)
          this.provider.unsubscribe(
            waitTopic,
            waitCallback,
            waitFilter,
            waitEqual
          )
        } else {
          console.log(
            this.me,
            `error feedbackCallback got wrong value`,
            sentValue
          )
        }
      }
    }
  }
}
