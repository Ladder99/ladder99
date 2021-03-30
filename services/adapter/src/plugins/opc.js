// opc
// client for opc server

// note: multiline named import fails so must do this
import pkg from 'node-opcua-client'
const {
  OPCUAClient,
  MessageSecurityMode,
  SecurityPolicy,
  AttributeIds,
  makeBrowsePath,
  ClientSubscription,
  TimestampsToReturn,
  ClientMonitoredItem,
} = pkg

// initialize the client plugin
export async function init({ url, cache, deviceId }) {
  console.log('OPC init', { deviceId })

  // instantiate client
  // by default, the node-opcua client will continuously try to connect to the endpoint.
  console.log(`OPC create client...`)
  const connectionStrategy = {
    initialDelay: 1000,
    maxRetry: 1,
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
  const endpointUrl = url

  try {
    await timeout(10000) // let server get started (slowish)

    // step 1 connect
    console.log(`OPC connecting to server at`, endpointUrl, `...`)
    await client.connect(endpointUrl)

    // step 2 createSession
    console.log('OPC creating session...')
    const session = await client.createSession()

    // // step 3 browse the root folder
    // const browseResult = await session.browse('RootFolder')
    // console.log('OPC references of RootFolder :')
    // for (const reference of browseResult.references) {
    //   console.log('  -> ', reference.browseName.toString())
    // }

    // step 4 : read a variable with readVariableValue
    // let nodeId = 'ns=1;s=free_memory'
    let nodeId = 'ns=1;B3:5'
    const dataValue2 = await session.read({
      nodeId,
      attributeId: AttributeIds.Value,
    })
    console.log(`OPC read ${nodeId}:`, dataValue2)

    // // step 4' : read a variable with read
    // const maxAge = 0
    // nodeId = 'ns=3;s=Scalar_Simulation_String'
    // const nodeToRead = {
    //   nodeId,
    //   attributeId: AttributeIds.Value,
    // }
    // const dataValue = await session.read(nodeToRead, maxAge)
    // console.log(`OPC read ${nodeId}:`, dataValue)

    // // step 5: install a subscription and install a monitored item for 10 seconds
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

    // // step 6 find the nodeId of a node by Browse name
    // const browsePath = makeBrowsePath(
    //   'RootFolder',
    //   '/Objects/Server.ServerStatus.BuildInfo.ProductName'
    // )
    // const result = await session.translateBrowsePath(browsePath)
    // const productNameNodeId = result.targets[0].targetId
    // console.log('OPC product name nodeId:', productNameNodeId.toString())

    // step 7 close session
    console.log(`OPC closing session...`)
    await session.close()

    // step 8 disconnect
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
