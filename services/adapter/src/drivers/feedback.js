// feedback driver

import { getMqtt } from './mqtt-provider.js' // this wraps libmqtt

export class AdapterDriver {
  init({ feedback, cache, host, port }) {
    console.log(`Initialize feedback driver...`)
    console.log(feedback)
    this.feedback = feedback
    this.cache = cache
    this.provider = provider //. how get? just import and call getProvider?
    this.oldValue = null

    //. mebbe setup yaml should provide as a url
    const url = `mqtt://${host}:${port}`
    console.log('MQTT-subscriber initializing driver', url)

    // connect to mqtt broker/server
    console.log(`MQTT-subscriber getting MQTT-provider singleton...`)
    // const mqtt = libmqtt.connect(url)
    //. our mqtt object has same api as libmqtt's object, just extended a little bit.
    this.provider = getMqtt(url) // get singleton libmqtt object, but don't try to connect yet

    // poll jobnum - when changes, send reset cmd, wait for response, send 2nd cmd
    this.check()
    global.setInterval(this.check, 2000)
  }

  check() {
    //. don't want this to send reset if just starting up though - how avoid?
    const newValue = cache.get('m1-job') //.
    if (newValue !== this.oldValue) {
      //. send msg, wait for response, send second
      this.provider.subscribe(topic2, callback, selector)
      this.provider.publish(topic, payload)
      this.oldValue = newValue
      function callback(payload) {
        if (payload.a15 == 5392) {
          this.provider.publish(topic, payload)
          this.provider.unsubscribe(topic2, callback)
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
