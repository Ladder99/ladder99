// opc driver
// client for opc server

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

//. convert to class

// start the client plugin
export async function start({ url, cache, device }) {
  console.log('OPC start', device.id)

  console.log(`OPC create client...`)
  const connectionStrategy = {
    initialDelay: 1000,
    maxRetry: 1, // default is infinite
  }
  const client = OPCUAClient.create({
    applicationName: 'MyClient',
    connectionStrategy: connectionStrategy,
    securityMode: MessageSecurityMode.None,
    securityPolicy: SecurityPolicy.None,
    endpoint_must_exist: false,
  })
  // const endpointUrl = "opc.tcp://opcuademo.sterfive.com:26543";
  // const endpointUrl = 'opc.tcp://' + os.hostname() + ':4334/UA/LittleServer'
  // const endpointUrl = 'opc.tcp://simulator-opc:4334/UA/LittleServer'
  // const endpointUrl = url

  try {
    //. better to check if up every n secs
    await timeout(10000) // let server get started (slowish)

    console.log(`OPC connecting to server at ${url}...`)
    await client.connect(url)

    console.log('OPC creating session...')
    const session = await client.createSession()

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
  } catch (err) {
    console.log('OPC an error has occured:', err)
  }
}

async function timeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
