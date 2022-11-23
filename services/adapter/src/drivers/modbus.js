// modbus driver

export class AdapterDriver {
  //
  async start({ device, cache, source, schema }) {
    //
    console.log('Modbus init', device.id)
    this.device = device
    this.cache = cache
    this.source = source
    this.schema = schema
    this.inputs = schema?.inputs?.inputs || [] // array of { key, nodeId }
    this.url = source?.connect?.url ?? defaultUrl
    console.log('Modbus inputs', this.inputs)
    this.subscriptions = []

    this.setValue('avail', 'UNAVAILABLE') // write to cache
    this.session = await this.getOPCSession() // connect to opc server
    this.setValue('avail', 'AVAILABLE') // connected successfully

    // iterate over inputs, fetch latest values, write to cache
    for (let input of this.inputs) {
      const subscription = this.subscribe(input)
      this.subscriptions.push(subscription)
    }
  }

  //

  async getOPCSession() {
    //
    console.log(`Modbus getting client...`)
    const connectionStrategy = {
      initialDelay: 1000,
    }
    this.client = OPCUAClient.create({
      applicationName: 'Ladder99',
      connectionStrategy: connectionStrategy,
      securityMode: MessageSecurityMode.None,
      securityPolicy: SecurityPolicy.None,
      endpointMustExist: false,
    })

    console.log(`Modbus connecting to server at ${this.url}...`)
    let connected = false
    while (!connected) {
      try {
        await this.client.connect(this.url) // returns Promise void, or throws error if fails
        connected = true
        console.log(`Modbus connected to server`)
      } catch (e) {
        console.log('Modbus error connecting to server:', e.message)
        console.log('Modbus waiting a bit...')
        await timeout(2000)
      }
    }

    console.log('Modbus creating session...')
    let session = null
    while (!session) {
      try {
        session = await this.client.createSession()
        console.log(`Modbus created session`)
      } catch (e) {
        console.log('Modbus error creating session:', e.message)
        console.log('Modbus waiting a bit...')
        await timeout(2000)
      }
    }
    return session
  }

  // subscribe and monitor an input item, write changes to cache
  subscribe(input) {
    //
    console.log('Modbus subscribing to', input.key, input.nodeId)

    // create subscription
    const subscription = ClientSubscription.create(this.session, {
      requestedPublishingInterval: 1000,
      maxNotificationsPerPublish: 100,
      publishingEnabled: true,
      priority: 10,
      // requestedLifetimeCount: 10,
      // requestedMaxKeepAliveCount: 10,
    })

    // attach listeners
    subscription
      .on('started', () => {
        console.log('Modbus subscription started')
        console.log('Modbus subscriptionId', subscription.subscriptionId)
      })
      .on('keepalive', () => console.log('Modbus subscription keepalive'))
      .on('terminated', () => console.log('Modbus subscription terminated'))

    // create monitored item
    const itemToMonitor = {
      nodeId: input.nodeId,
      attributeId: AttributeIds.Value,
    }
    const parameters = {
      samplingInterval: 500, // ms
      discardOldest: true,
      queueSize: 10,
    }
    const monitoredItem = ClientMonitoredItem.create(
      subscription,
      itemToMonitor,
      parameters,
      TimestampsToReturn.Both
    )

    // attach listener to write value to cache
    const that = this
    monitoredItem.on('changed', dataValue => {
      const raw = dataValue.value.value // dataValue is a variant
      const value =
        input.decimals === undefined ? raw : lib.round(raw, input.decimals)
      console.log(`Modbus ${input.key} value has changed:`, value)
      that.setValue(input.key, value) // write to cache
    })

    return subscription
  }

  async stop() {
    console.log('Modbus terminating subscriptions...')
    for (let subscription of this.subscriptions) {
      await subscription.terminate()
    }

    console.log(`Modbus closing session...`)
    await this.session.close()

    console.log(`Modbus disconnecting...`)
    await this.client.disconnect()

    console.log('Modbus stopped')
  }

  // helper methods

  setValue(key, value) {
    const id = this.device.id + '-' + key
    this.cache.set(id, value)
  }
}

// helper fns

async function timeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
