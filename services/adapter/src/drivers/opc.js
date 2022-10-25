// opc driver
// client for opc server

// adapted from
// https://github.com/node-opcua/node-opcua/blob/master/documentation/creating_a_client_typescript.md

// see https://github.com/node-opcua/node-opcua/tree/master/packages/node-opcua-client
import pkg from 'node-opcua-client'
// note: multiline named import fails so must do this
const {
  OPCUAClient,
  MessageSecurityMode,
  SecurityPolicy,
  AttributeIds,
  ClientSubscription,
  TimestampsToReturn,
  ClientMonitoredItem,
} = pkg
import * as lib from '../common/lib.js'

//. move these to base setup yaml
const defaultUrl = 'opc.tcp://host.docker.internal:49320' // for kepware via localhost
// const defaultUrl = 'opc.tcp://simulator:4334/UA/LittleServer' // for simulator service

export class AdapterDriver {
  //
  async start({ device, cache, source, module }) {
    //
    console.log('OPC init', device.id)
    this.device = device
    this.cache = cache
    this.source = source
    this.module = module
    this.inputs = module?.inputs?.inputs || [] // array of { key, nodeId }
    this.url = source?.connect?.url ?? defaultUrl
    console.log('OPC inputs', this.inputs)
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
    console.log(`OPC getting client...`)
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

    console.log(`OPC connecting to server at ${this.url}...`)
    let connected = false
    while (!connected) {
      try {
        await this.client.connect(this.url) // returns Promise void, or throws error if fails
        connected = true
        console.log(`OPC connected to server`)
      } catch (e) {
        console.log('OPC error connecting to server:', e.message)
        console.log('OPC waiting a bit...')
        await timeout(2000)
      }
    }

    console.log('OPC creating session...')
    let session = null
    while (!session) {
      try {
        session = await this.client.createSession()
        console.log(`OPC created session`)
      } catch (e) {
        console.log('OPC error creating session:', e.message)
        console.log('OPC waiting a bit...')
        await timeout(2000)
      }
    }
    return session
  }

  // subscribe and monitor an input item, write changes to cache
  subscribe(input) {
    //
    console.log('OPC subscribing to', input.key, input.nodeId)
    // const { key, nodeId } = input

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
        console.log('OPC subscription started')
        console.log('OPC subscriptionId', subscription.subscriptionId)
      })
      .on('keepalive', () => console.log('OPC subscription keepalive'))
      .on('terminated', () => console.log('OPC subscription terminated'))

    // create monitored item
    const itemToMonitor = {
      nodeId: input.nodeId,
      attributeId: AttributeIds.Value,
    }
    const parameters = {
      samplingInterval: 100,
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
        input.decimals === undefined ? raw : lib.rounded(raw, input.decimals)
      console.log(`OPC ${input.key} value has changed:`, value)
      that.setValue(input.key, value)
    })

    return subscription
  }

  async stop() {
    console.log('OPC terminating subscriptions...')
    for (let subscription of this.subscriptions) {
      await subscription.terminate()
    }

    console.log(`OPC closing session...`)
    await this.session.close()

    console.log(`OPC disconnecting...`)
    await this.client.disconnect()

    console.log('OPC stopped')
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
