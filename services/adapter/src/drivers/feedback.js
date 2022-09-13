// feedback driver

export class AdapterDriver {
  //
  init({ setup, source, device, cache, inputs, connection }) {
    console.log(`Feedback initialize driver for`, device.id)
    console.log(`Feedback source`, source)

    this.cache = cache // need for monitoring a value
    this.oldValue = null

    this.source = source

    // get base data
    const feedback = setup?.adapter?.drivers?.feedback || {}
    this.topic = feedback.topic || 'missing-topic'
    this.wait = feedback.wait || 'missing-topic'
    this.payload = feedback.payload || {}
    this.values = feedback.values
    const interval = feedback.interval

    // connect to mqtt broker/server
    //. could we pass provider down instead of repeating this?
    console.log('Feedback getting provider for', connection)
    const provider = inputs[connection]?.plugin // get shared connection - eg mqtt-provider
    if (!provider) {
      console.log(`Error - unknown provider connection`, connection)
      process.exit(1)
    }
    this.provider = provider

    // check jobnum - when changes, send reset cmd, wait for response, send 2nd cmd
    this.poll()
    setInterval(this.poll.bind(this), interval)
  }

  poll() {
    // check if value changed, then send reset commands
    //. don't want this to send reset if just starting up though - how avoid?
    const newValue = this.cache.get(this.source.monitor) // eg 'm1-job'
    if (newValue !== this.oldValue) {
      //. send msg, wait for response, send second

      // subscribe to response topic
      const selector = payload => payload.id == this.source.id // eg id=535172
      const callback = waitForSignal.bind(this)
      this.provider.subscribe(this.wait, callback, selector)

      // publish to reset topic
      const { address, values } = this.source
      const payload = { ...this.payload, address, value: this.values[0] }
      this.provider.publish(this.topic, JSON.toString(payload))
      this.oldValue = newValue

      function waitForSignal(payload) {
        //. make a15 a param
        if (payload.a15 == this.values[0]) {
          const payload = { ...this.payload, address, value: this.values[1] }
          this.provider.publish(this.topic, JSON.toString(payload))
          this.provider.unsubscribe(this.topic, callback) //. handle callback
        }
      }
    }
  }

  // this method is OPTIONAL - some drivers might need a direct connection
  // to agent, eg see random.js.
  setSocket(socket) {
    this.socket = socket
  }
}
