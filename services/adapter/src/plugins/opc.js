// declaration
import {
  OPCUAClient,
  MessageSecurityMode,
  SecurityPolicy,
  AttributeIds,
  makeBrowsePath,
  ClientSubscription,
  TimestampsToReturn,
  MonitoringParametersOptions,
  ReadValueIdLike,
  ClientMonitoredItem,
  DataValue,
} from 'node-opcua'

// client instantiation

// by default, the node-opcua client will continuously try to connect to the endpoint.
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
//const endpointUrl = "opc.tcp://opcuademo.sterfive.com:26543";
const endpointUrl =
  'opc.tcp://' + require('os').hostname() + ':4334/UA/MyLittleServer'

// setting up a series of asynchronous operations

// utility function

async function main() {
  try {
    // step 1 : connect to
    // _"Connection"
    // step 2 : createSession
    // _"create session"
    // step 3 : browse
    // _"browsing the root folder"
    // step 4 : read a variable with readVariableValue
    // _"read a variable with readVariableValue"
    // step 4' : read a variable with read
    // _"read a variable with read"
    // step 5: install a subscription and install a monitored item for 10 seconds
    // _"install a subscription"
    // step 6: finding the nodeId of a node by Browse name
    // _"finding the nodeId of a node by Browse name"
    // close session
    // _"closing session"
    // disconnecting
    // _"disconnecting"
  } catch (err) {
    console.log('An error has occured : ', err)
  }
}
main()
