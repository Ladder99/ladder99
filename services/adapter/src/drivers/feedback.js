// feedback driver

// currently used for watching changes to jobboss job number,
// sending a part count reset to a marumatsu cutter via mqtt.

// in setup.yaml, do sthing like this -
//
// adapter:
//   drivers:
//     feedback:
//       dataitem: job # this will be prefixed with deviceId, eg to 'm1-job' - reset partcount when changes
//       interval: 2000 # ms to wait between polls
//       driver: sharedMqtt
//       command:
//         topic: l99/B01000/cmd/modbus # mqtt topic to send commands to
//       payload:
//         address: null # varies by device - eg 142
//         value: null # send values[0], wait, then values[1]
//         unitid: 199
//         quantity: 1
//         fc: 6
//       values: [5392, 0] # values for payload
//       wait:
//         topic: l99/B01000/evt/io # mqtt topic to watch after posting command
//         attribute: a15 # watch this payload attribute
//         value: 5392 # wait for it to get this value before sending second command

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

      // subscribe to response topic
      // will subscribe to mqttProvider with dispatch based on payload.id
      const waitTopic = this.wait.topic
      const waitCallback = waitForSignal.bind(this)
      const selector = payload => payload.id == this.source.id // eg id=535172 - use == in case string/number
      console.log(this.me, `subscribing to`, waitTopic, selector)
      this.provider.subscribe(waitTopic, waitCallback, selector)

      // publish to command topic
      const { address } = this.source // { driver, connection, address, id }
      const values = this.values // eg [5392, 0]
      const commandTopic = this.command.topic
      const payload = { ...this.payload, address, value: values[0] } // { address, value, unitid, quantity, fc }
      console.log(this.me, `publishing command`, commandTopic, payload)
      console.log(this.me, `waiting for response...`)
      this.provider.publish(commandTopic, JSON.toString(payload))
      this.oldValue = newValue

      //. what if the response never comes? need a timeout after a minute?
      // then cancel the subscription, and send the second command anyway?

      function waitForSignal(topic, payload) {
        payload = payload.toString()
        payload = JSON.parse(payload)
        const waitValue = payload[this.wait.attribute] // eg payload.a15
        console.log(this.me, `got response`, payload, waitValue)
        // eg this.values[0] is 5392
        // note: we use == because either might be a string, not number
        if (waitValue == values[0]) {
          // publish second command
          const payload = { ...this.payload, address, value: values[1] }
          console.log(this.me, `publish 2nd command`, commandTopic, payload)
          this.provider.publish(commandTopic, JSON.toString(payload))
          // unsubscribe from the wait topic
          console.log(this.me, `unsubscribe`, waitTopic)
          this.provider.unsubscribe(waitTopic, waitCallback) //. does this work?
        }
      }
    }
  }
}
