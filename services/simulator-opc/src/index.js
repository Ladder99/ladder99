// simulator-opc
// simulates an opc server

// the endpoint urn of our server will be
//   opc.tcp://<hostname>:4334/UA/LittleServer
// where hostname shall be replaced with your computer name or fully qualified domain name.

const os = require('os')
const { OPCUAServer, Variant, DataType, StatusCodes } = require('node-opcua')

;(async () => {
  // create an instance of OPCUAServer
  const server = new OPCUAServer({
    port: 4334, // the port of the listening socket of the server
    resourcePath: '/UA/LittleServer', // this path will be added to the endpoint resource name
    buildInfo: {
      productName: 'SampleServer1',
      buildNumber: '7658',
      buildDate: new Date(2014, 5, 2),
    },
  })

  // server initialisation
  await server.initialize()
  console.log('initialized')

  // post initialisation
  // The addressSpace is used to customize the object model that our server
  // will expose to the external world.
  const addressSpace = server.engine.addressSpace
  const namespace = addressSpace.getOwnNamespace()

  // add a new object into the objects folder
  const device = namespace.addObject({
    organizedBy: addressSpace.rootFolder.objects,
    browseName: 'MyDevice',
  })

  // add some variables

  // add a variable named MyVariable1 to the newly created folder "MyDevice".
  // Adding a read-only variable inside the server namespace requires
  // only a getter function. This function returns a Variant containing the
  // value of the variable to scan.
  // Note that we haven't specified a NodeId for the variable. The server will
  // automatically assign a new nodeId for us.
  let variable1 = 1
  // emulate variable1 changing every 500 ms
  setInterval(() => (variable1 += 1), 500)
  namespace.addVariable({
    componentOf: device,
    browseName: 'MyVariable1',
    dataType: 'Double',
    value: {
      get: () => new Variant({ dataType: DataType.Double, value: variable1 }),
    },
  })

  // add a read/write variable to the newly created folder "MyDevice".
  let variable2 = 10.0
  namespace.addVariable({
    componentOf: device,
    nodeId: 'ns=1;b=1020FFAA', // some opaque NodeId in namespace 4
    browseName: 'MyVariable2',
    dataType: 'Double',
    value: {
      get: () => new Variant({ dataType: DataType.Double, value: variable2 }),
      set: variant => {
        variable2 = parseFloat(variant.value)
        return StatusCodes.Good
      },
    },
  })

  namespace.addVariable({
    componentOf: device,
    nodeId: 's=free_memory', // a string nodeID
    browseName: 'FreeMemory',
    dataType: 'Double',
    value: {
      get: () =>
        new Variant({ dataType: DataType.Double, value: available_memory() }),
    },
  })

  // start the server
  server.start(function () {
    console.log('Server is now listening ... ( press CTRL+C to stop)')
    console.log('port ', server.endpoints[0].port)
    // display endpoint url
    const endpointUrl = server.endpoints[0].endpointDescriptions()[0]
      .endpointUrl
    console.log('the primary server endpoint url is ', endpointUrl)
  })
})()

/**
 * returns the percentage of free memory on the running machine
 * @return {Number}
 */
function available_memory() {
  // var value = process.memoryUsage().heapUsed / 1000000;
  const percentageMemUsed = (os.freemem() / os.totalmem()) * 100.0
  return percentageMemUsed
}
