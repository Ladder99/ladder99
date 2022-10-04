// feedback driver

// currently used for watching changes to jobboss job number,
// sending a part count reset to a marumatsu cutter via mqtt.

// see client-oxbox/setup.yaml for an example of using this

//. will this be replaced by MTConnect Interfaces eventually?

// optional flag defined in .env
// lets you turn on the feedback mechanism for oxbox 001,
// but leave it off for 004. otherwise they would interfere with each other.
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

    // get base data, if there
    const feedback = setup.adapter?.drivers?.feedback || {}
    this.command = feedback.command || {} // { topic } for commands
    this.payload = feedback.payload || {} // defaults for command payload, if any
    this.values = feedback.values // array of the two values to send with commands
    this.wait = feedback.wait || {} // { topic, attribute, value } topic to wait on etc
    this.dataitem = device.id + '-' + feedback.dataitem // eg 'm1-job'

    const interval = feedback.interval // poll interval, ms

    // check jobnum - when changes, send reset cmd, wait for response, send 2nd cmd
    this.oldValue = null
    this.poll()
    setInterval(this.poll.bind(this), interval)
  }

  poll() {
    // check if value changed, then send reset commands - unless just starting up
    const newValue = this.cache.get(this.dataitem) // eg 'm1-job'
    this.oldValue = this.oldValue || newValue // this will avoid firing all this off if just starting up, when oldValue=null
    if (newValue !== this.oldValue) {
      //
      // send msg, wait for response, send second
      console.log(this.me, `value changed from ${this.oldValue} to ${newValue}`)

      const waitAttribute = this.wait.attribute // eg 'a15'
      const values = this.values // eg [5392, 0]

      // subscribe to response topic
      // will subscribe to mqttProvider with dispatch based on payload.id
      const waitTopic = this.wait.topic
      const waitCallback = waitForSignal.bind(this)
      // make selector - use == in case string/number, eg id==535172 && a15==5392
      // const waitSelector = payload =>
      //   payload.id == this.source.id &&
      //   payload[this.wait.attribute] == values[0]
      const waitSelector = { id: this.source.id, [waitAttribute]: values[0] }
      console.log(this.me, `subscribe`, waitTopic, waitSelector)
      // note: we pass sendLastMessage=false so doesn't call the callback if topic already registered
      this.provider.subscribe(waitTopic, waitCallback, waitSelector, false)

      // publish to command topic
      const { address } = this.source // { driver, connection, address, id }
      const commandTopic = this.command.topic
      const commandPayload = { ...this.payload, address, value: values[0] } // { address, value, unitid, quantity, fc }
      console.log(this.me, `publish`, commandTopic, commandPayload)
      this.provider.publish(commandTopic, JSON.toString(commandPayload))
      this.oldValue = newValue

      //. what if the response never comes? need a timeout after a minute?
      // then cancel the subscription, and send the second command anyway?

      function waitForSignal(topic, payload) {
        payload = payload.toString()
        payload = JSON.parse(payload)
        const sentValue = payload[waitAttribute] // eg payload.a15
        console.log(this.me, `waitForSignal got response`, payload, sentValue)

        // note: we use == because either might be a string, not number.
        // selector should have checked this already, but just in case.
        if (sentValue == values[0]) {
          // publish the second command
          const commandPayload = { ...this.payload, address, value: values[1] }
          console.log(this.me, `publish`, commandTopic, commandPayload)
          this.provider.publish(commandTopic, JSON.toString(commandPayload))

          // unsubscribe from the wait topic
          console.log(this.me, `unsubscribe`, waitTopic, waitCallback.name)
          this.provider.unsubscribe(waitTopic, waitCallback, waitSelector)
        } else {
          console.log(this.me, `error waitForSignal got wrong value`, sentValue)
        }
      }
    }
  }
}
