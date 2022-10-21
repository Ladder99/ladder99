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
  makeBrowsePath,
  // ClientSubscription,
  // TimestampsToReturn,
  // ClientMonitoredItem,
} = pkg

// host.docker.internal lets you access localhost on the host computer, which is running kepware
const defaultUrl = 'opc.tcp://host.docker.internal:49320'

// the simulator service runs an opc server on this port
// const defaultUrl = 'opc.tcp://simulator:4334/UA/LittleServer'

export class AdapterDriver {
  //
  // initialize the client plugin
  async init({ device, cache, source }) {
    console.log('OPC init', device.id)

    const url = source?.connect?.url ?? defaultUrl

    // note: if agent has not connected yet, this will save the last value and send it on connection.
    //. should it save array of values and send them all? mebbe
    cache.set('opc-avail', 'UNAVAILABLE')

    // create client
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

    // get connection
    let connected = false
    while (!connected) {
      try {
        console.log(`OPC connecting to server at ${url}...`)
        await client.connect(url) // returns Promise void, or throws error if fails
        connected = true
        console.log(`OPC connected to server`)
      } catch (e) {
        console.log('OPC error - waiting a bit', e.message)
        await timeout(2000)
      }
    }

    // get session
    let session = null
    while (!session) {
      try {
        console.log('OPC creating session...')
        session = await client.createSession()
        console.log(`OPC created session`)
      } catch (e) {
        console.log('OPC error - waiting a bit', e.message)
        await timeout(2000)
      }
    }

    // connected - set avail
    cache.set('opc-avail', 'AVAILABLE')

    //. here we'll iterate over inputs, fetch or subscribe to them,
    // and set the cache key-value pairs.

    const browseResult = await session.browse('RootFolder')
    console.log('OPC references of RootFolder :')
    for (const reference of browseResult.references) {
      console.log('   -> ', reference.browseName.toString())
    }

    const browsePath = makeBrowsePath(
      'RootFolder',
      '/Objects/Server.ServerStatus.BuildInfo.ProductName'
    )
    const result = await session.translateBrowsePath(browsePath)
    const productNameNodeId = result.targets[0].targetId
    console.log('OPC Product Name nodeId = ', productNameNodeId.toString())

    // read operator
    // let nodeId =
    // 'ns=1;s=Kepware.KEPServerEX.V6.Simulation Examples.Function.User1'
    let nodeId = productNameNodeId
    const dataValue = await session.read({
      nodeId,
      attributeId: AttributeIds.Value,
    })
    console.log(`OPC read ${nodeId}:`, dataValue) //.value) // a variant
    // const operator = dataValue.value.value //. better way?
    // const key = `${device.id}-`
    // console.log(`OPC setting cache ${key}:`, operator)
    // cache.set(key, operator)

    // // read operator
    // let nodeId = 'ns=1;s=Operator'
    // const dataValue3 = await session.read({
    //   nodeId,
    //   attributeId: AttributeIds.Value,
    // })
    // console.log(`OPC read ${nodeId}:`, dataValue3.value) // a variant
    // const operator = dataValue3.value.value //. better way?
    // const key = `${device.id}-operator`
    // console.log(`OPC setting cache ${key}:`, operator)
    // cache.set(key, operator)

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
