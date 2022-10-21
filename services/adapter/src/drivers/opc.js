// opc driver
// client for opc server

// adapted from
// https://github.com/node-opcua/node-opcua/blob/master/documentation/creating_a_client_typescript.md

// see https://github.com/node-opcua/node-opcua/tree/master/packages/node-opcua-client
// note: multiline named import fails so must do this
import pkg from 'node-opcua-client'
const {
  OPCUAClient,
  MessageSecurityMode,
  SecurityPolicy,
  AttributeIds,
  // makeBrowsePath,
  // ClientSubscription,
  // TimestampsToReturn,
  // ClientMonitoredItem,
} = pkg

export class AdapterDriver {
  //
  // initialize the client plugin
  async init({ device, cache, source }) {
    console.log('OPC init', device.id)

    // note: if agent has not connected yet, this will save the last value and send it on connection.
    //. should it save array of values and send them all? mebbe
    cache.set('opc-avail', 'UNAVAILABLE')

    console.log(`OPC create client...`)
    const connectionStrategy = {
      initialDelay: 1000,
      maxRetry: 10, // default is infinite
    }
    const client = OPCUAClient.create({
      applicationName: 'MyClient',
      connectionStrategy: connectionStrategy,
      securityMode: MessageSecurityMode.None,
      securityPolicy: SecurityPolicy.None,
      endpointMustExist: false,
    })
    // console.log(`OPC client`, client)

    // const endpointUrl = "opc.tcp://opcuademo.sterfive.com:26543";
    // const endpointUrl = 'opc.tcp://simulator:4334/UA/LittleServer'
    // const endpointUrl = url
    // const url = source?.connect?.url || 'opc.tcp://localhost:4840' // default is kepware url
    const url = source?.connect?.url || 'opc.tcp://host.docker.internal:4840' // default is kepware url

    //. check for connection every n secs
    // await timeout(2000) // let server get started (slowish)

    let connected = false
    while (!connected) {
      try {
        console.log(`OPC connecting to server at ${url}...`)
        await client.connect(url) // returns void
        connected = true
      } catch (e) {
        console.log('OPC error - waiting a bit', e.message)
        await timeout(2000)
      }
    }

    let session = null
    while (!session) {
      try {
        console.log('OPC creating session...')
        session = await client.createSession()
      } catch (e) {
        console.log('OPC error - waiting a bit', e.message)
        await timeout(2000)
      }
    }

    // connected - set avail
    cache.set('opc-avail', 'AVAILABLE')

    //. here we'll iterate over inputs, fetch or subscribe to them,
    // and set the cache key-value pairs.

    // read operator
    let nodeId = 'ns=1;s=Operator'
    const dataValue3 = await session.read({
      nodeId,
      attributeId: AttributeIds.Value,
    })
    console.log(`OPC read ${nodeId}:`, dataValue3.value) // a variant
    const operator = dataValue3.value.value //. better way?
    const key = `${device.id}-operator`
    console.log(`OPC setting cache ${key}:`, operator)
    cache.set(key, operator)

    // // subscribe and monitor item for n seconds
    // const subscription = ClientSubscription.create(session, {
    //   requestedPublishingInterval: 1000,
    //   requestedLifetimeCount: 100,
    //   requestedMaxKeepAliveCount: 10,
    //   maxNotificationsPerPublish: 100,
    //   publishingEnabled: true,
    //   priority: 10,
    // })
    // subscription
    //   .on('started', function () {
    //     console.log(
    //       'OPC subscription started for 2 seconds - subscriptionId=',
    //       subscription.subscriptionId
    //     )
    //   })
    //   .on('keepalive', function () {
    //     console.log('OPC subscription keepalive')
    //   })
    //   .on('terminated', function () {
    //     console.log('OPC subscription terminated')
    //   })
    // // install monitored item
    // const itemToMonitor = {
    //   nodeId: 'ns=1;s=free_memory',
    //   attributeId: AttributeIds.Value,
    // }
    // const parameters = {
    //   samplingInterval: 100,
    //   discardOldest: true,
    //   queueSize: 10,
    // }
    // const monitoredItem = ClientMonitoredItem.create(
    //   subscription,
    //   itemToMonitor,
    //   parameters,
    //   TimestampsToReturn.Both
    // )
    // monitoredItem.on('changed', dataValue => {
    //   console.log(
    //     'OPC free_memory value has changed:',
    //     dataValue.value.toString()
    //   )
    // })
    // await timeout(4000)
    // console.log('OPC now terminating subscription')
    // await subscription.terminate()

    console.log(`OPC closing session...`)
    await session.close()

    console.log(`OPC disconnecting...`)
    await client.disconnect()

    console.log('OPC done')
  }
}

async function timeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
