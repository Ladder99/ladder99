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
  // read once and set cache value
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
//   requestedLifetimeCount: 10,
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
//   // nodeId: 'ns=1;s=free_memory',
//   nodeId: 'ns=2;s=Simulation Examples.Functions.User1',
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
//   console.log('OPC user1 value has changed:', dataValue.value.toString())
// })
