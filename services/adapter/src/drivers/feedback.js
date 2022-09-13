// feedback driver

export class AdapterDriver {
  //
  init({ setup, source, device, cache, connections, connection }) {
    console.log(`Feedback initialize driver for`, device.id)
    console.log(`Feedback source`, source)

    this.cache = cache // need for monitoring a value
    this.oldValue = null

    this.source = source

    // get base data
    this.topic = setup.adapter?.reset?.topic || 'missing-topic'
    this.payload = setup.adapter?.reset?.payload || {}
    this.wait = setup.adapter?.reset?.wait || 'missing-topic'
    const interval = setup.adapter?.reset?.interval

    // connect to mqtt broker/server
    console.log('Feedback getting provider for', connection)
    const provider = connections[connection]?.plugin // get shared connection - eg mqtt-provider
    if (!provider) {
      console.log(`Error - unknown provider connection`, connection)
      process.exit(1)
    }
    console.log(`Feedback got provider`, provider)

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
      this.provider.publish(this.source.publish, payload)
      this.oldValue = newValue
      function waitForSignal(payload) {
        if (payload.a15 == 5392) {
          this.provider.publish(topic, payload)
          this.provider.unsubscribe(this.source.subscribe, callback)
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
