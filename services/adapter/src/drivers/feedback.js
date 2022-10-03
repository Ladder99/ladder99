// feedback driver

// currently used for watching changes to jobboss job number,
// sending a part count reset to a marumatsu cutter via mqtt.

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
    const feedback = setup?.adapter?.drivers?.feedback || {}
    this.command = feedback.command || 'missing-command-topic' // topic for commands
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
      // send msg, wait for response, send second
      console.log(this.me, `value changed from ${this.oldValue} to ${newValue}`)

      // subscribe to response topic
      // will subscribe to mqttProvider with dispatch based on payload.id
      const topic = this.wait.topic
      const callback = waitForSignal.bind(this)
      const selector = payload => payload.id == this.source.id // eg id=535172
      console.log(this.me, `subscribing to`, topic, selector)
      this.provider.subscribe(topic, callback, selector)

      // publish to reset topic
      const { address } = this.source // { driver, connection, address, id }
      const values = this.values // eg [5392, 0]
      const payload = { ...this.payload, address, value: values[0] } // { address, value, unitid, quantity, fc }
      console.log(this.me, `publishing command`, this.command, payload)
      console.log(this.me, `waiting for response...`)
      this.provider.publish(this.command, JSON.toString(payload))
      this.oldValue = newValue

      function waitForSignal(topic, payload) {
        payload = JSON.parse(payload)
        console.log(this.me, `got response`, payload)
        // eg this.wait.attribute is 'a15', values[0] is 5392
        // note: we use == because either might be a string, not number
        if (payload[this.wait.attribute] == this.values[0]) {
          // publish second command
          // console.log(this.me, `got response`)
          const payload = { ...this.payload, address, value: this.values[1] }
          console.log(this.me, `publish 2nd command`, this.command, payload)
          this.provider.publish(this.command, JSON.toString(payload))
          // unsubscribe from the wait topic
          console.log(this.me, `unsubscribe`, topic)
          this.provider.unsubscribe(topic, callback) //. does this work?
        }
      }
    }
  }
}
