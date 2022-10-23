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

//

// host.docker.internal lets you access localhost on the host computer, which is running kepware
const defaultUrl = 'opc.tcp://host.docker.internal:49320'

// the simulator service runs an opc server on this port
// const defaultUrl = 'opc.tcp://simulator:4334/UA/LittleServer'

//

export class AdapterDriver {
  //
  // initialize the client plugin
  async init({ device, cache, source, inputs }) {
    console.log('OPC init', device.id)

    this.device = device
    this.cache = cache
    this.source = source
    this.inputs = inputs.inputs //. bleh don't like

    console.log('OPC inputs', this.inputs)

    const url = source?.connect?.url ?? defaultUrl

    // set cache value
    // note: if agent has not connected yet,
    // this will save the last value and send it on connection.
    this.setValue('avail', 'UNAVAILABLE')

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

    // connected
    this.setValue('avail', 'AVAILABLE')

    //. here we can iterate over inputs, fetch or subscribe to them,
    // and set the cache key-value pairs.

    // // browse names
    // //. just gives 'Objects', 'Types', 'Values' - how recurse?
    // const browseResult = await session.browse('RootFolder')
    // console.log('OPC references of RootFolder :')
    // for (const reference of browseResult.references) {
    //   console.log('   -> ', reference.browseName.toString())
    // }

    // const browsePath = makeBrowsePath('RootFolder', '/Objects/2:MyObject/2:MyVariable')

    // const browsePath =
    //   makeBrowsePath()
    //   // 'RootFolder',
    //   // '/Objects/Server.ServerStatus.BuildInfo.ProductName'
    //   // '/Objects/Simulation Examples/Functions/User1'
    //   // '2:User1'
    // const result = await session.translateBrowsePath(browsePath)
    // const productNameNodeId = result.targets[0]?.targetId
    // console.log('OPC Product Name nodeId', productNameNodeId.toString())
    // // console.log('OPC Product Name nodeId', productNameNodeId)
    // console.log()

    // // read operator
    // // let nodeId = productNameNodeId
    // let nodeId = 'ns=2;s=Simulation Examples.Functions.User1'
    // const dataValue = await session.read({
    //   nodeId,
    //   attributeId: AttributeIds.Value,
    // })
    // console.log(`OPC read`, nodeId.toString(), dataValue.value.value) // a variant
    // // const operator = dataValue.value.value //. better way?
    // // const key = `${device.id}-`
    // // console.log(`OPC setting cache ${key}:`, operator)
    // // cache.set(key, operator)
    // console.log()

    // iterate over inputs, fetch latest values, write to cache
    for (let input of this.inputs) {
      const { key, nodeId } = input
      const dataValue = await session.read({
        nodeId,
        attributeId: AttributeIds.Value,
      })
      console.log(`OPC read`, nodeId.toString(), dataValue.value.value) // a variant
      const value = dataValue.value.value
      this.setValue(key, value)
    }

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
