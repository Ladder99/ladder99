// feedback driver

// currently used for watching changes to jobboss job number,
// sending a part count reset to a marumatsu cutter via mqtt.

// see client-oxbox/setup.yaml for an example of using this.

//. will this be replaced by MTConnect Interfaces eventually?

// optional flag defined in .env.
// lets you turn on the feedback mechanism for a live/production device,
// but leave it off for a backup/development machine - otherwise they
// may interfere with each other.
const feedbackOn = process.env.L99_FEEDBACK

export class AdapterDriver {
  //
  start({ setup, source, device, cache, provider }) {
    this.me = `Feedback ${device.name}:`

    console.log(this.me, `L99_FEEDBACK =`, feedbackOn)
    if (!feedbackOn) return

    console.log(this.me, `start driver, source`, source)

    this.cache = cache // need for monitoring a value
    this.source = source // { driver, connection, address, id }
    this.provider = provider // eg the mqttProvider.js object

    // get base config, if there
    const feedback = setup.adapter?.drivers?.feedback || {}
    this.dataitem = device.id + '-' + feedback.dataitem // dataitem to watch - eg 'm1-job'
    this.command = feedback.command || {} // { topic, payload, values } for commands
    this.payload = this.command.payload || {} // eg { address, value, unitid, quantity, fc }
    this.values = this.command.values || [] // eg [5392, 0] the two values to send with commands
    this.wait = feedback.wait || {} // { topic, attribute, value } topic to wait on etc

    // check dataitem value - when changes, send reset cmd, wait for response, send 2nd cmd
    this.oldValue = null
    this.poll()
    setInterval(this.poll.bind(this), feedback.interval || 2000) // interval in ms
  }

  poll() {
    // check if dataitem value changed, then send reset commands - unless just starting up
    const newValue = this.cache.get(this.dataitem) // eg 'm1-job'
    this.oldValue = this.oldValue || newValue // this will avoid firing all this off if just starting up, when oldValue=null
    if (newValue !== this.oldValue) {
      //
      // send msg, wait for response, send second
      console.log(this.me, `value changed from ${this.oldValue} to ${newValue}`)

      const waitAttribute = this.wait.attribute // eg 'a15'
      const values = this.values // eg [5392, 0]

      // subscribe to response topic
      // will subscribe to mqttProvider with dispatch based on payload.id and waitAttribute value
      const waitTopic = this.wait.topic
      const waitCallback = feedbackWaitCallback.bind(this)
      const waitSelector = { id: this.source.id, [waitAttribute]: values[0] } // filter by example

      // //. or a selector could be an object with filter and equal - would be faster.
      // // one for dispatch on payload, one for comparing subscriptions.
      // // make selector - use == not === in case string/number, eg id==535172 && a15==5392
      // const waitSelector = {
      //   filter: payload =>
      //     payload.id == this.source.id && payload[waitAttribute] == values[0],
      //   equal: (payload1, payload2) =>
      //     JSON.stringify(payload1) === JSON.stringify(payload2),
      // }
      // const waitSelector = {
      //   filter: payload =>
      //     payload.id == this.source.id && payload[waitAttribute] == values[0],
      //   equal: payload => this.filter(payload) && payload.length === 2,
      // }

      // filter by fn - faster
      const waitFilter = payload =>
        payload.id == this.source.id && payload[waitAttribute] == values[0]

      // mqttProvider will use this to prevent duplicate subscriptions, and for unsubscribing
      // const waitEqual = payload => waitFilter(payload) && payload.length === 2
      const waitEqual = (subscriber1, subscriber2) =>
        waitFilter(payload) && payload.length === 2

      // subscribe to wait topic
      // note: we pass sendLastMessage=false so doesn't call the callback if topic already registered
      // console.log(this.me, `subscribe`, waitTopic, waitSelector)
      // this.provider.subscribe(waitTopic, waitCallback, waitSelector, false)
      this.provider.subscribe(
        waitTopic,
        waitCallback,
        waitFilter,
        waitEqual,
        false
      )

      // publish to command topic
      const { address } = this.source // { driver, connection, address, id }
      const commandTopic = this.command.topic
      const commandPayload = { ...this.payload, address, value: values[0] } // { address, value, unitid, quantity, fc }
      // console.log(this.me, `publish`, commandTopic, commandPayload)
      this.provider.publish(commandTopic, JSON.toString(commandPayload))
      this.oldValue = newValue

      // q. what if a response never comes? timeout after a minute?
      // well, it's okay - we check for duplicate subscriptions, so they won't clog the system.

      // callback for wait topic
      function feedbackWaitCallback(topic, payload) {
        payload = payload.toString()
        payload = JSON.parse(payload)

        const sentValue = payload[waitAttribute] // eg payload.a15
        console.log(
          this.me,
          `feedbackWaitCallback got response`,
          payload,
          sentValue
        )

        // note: we use == because either might be a string, not number.
        // selector should have checked this already, but just in case.
        if (sentValue == values[0]) {
          // publish the second command
          const commandPayload = { ...this.payload, address, value: values[1] }
          // console.log(this.me, `publish`, commandTopic, commandPayload)
          this.provider.publish(commandTopic, JSON.toString(commandPayload))

          // unsubscribe from the wait topic
          // console.log(this.me, `unsubscribe`, waitTopic, waitCallback.name)
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
            `error feedbackWaitCallback got wrong value`,
            sentValue
          )
        }
      }
    }
  }
}
