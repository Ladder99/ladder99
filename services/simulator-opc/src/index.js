const { OPCUAServer, Variant, DataType, StatusCodes } = require('node-opcua')

// the endpoint urn of our server will be
//   opc.tcp://<hostname>:4334/UA/MyLittleServer
// where hostname shall be replaced with your computer name or fully qualified domain name.

;(async () => {
  // create an instance of OPCUAServer
  const server = new OPCUAServer({
    port: 4334, // the port of the listening socket of the server
    resourcePath: '/UA/MyLittleServer', // this path will be added to the endpoint resource name
    buildInfo: {
      productName: 'MySampleServer1',
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

  // declare a new object
  // add a new object into the objects folder
  const device = namespace.addObject({
    organizedBy: addressSpace.rootFolder.objects,
    browseName: 'MyDevice',
  })

  // add some variables
  // Adding a read-only variable inside the server namespace requires
  // only a getter function. This function returns a Variant containing the
  // value of the variable to scan.
  // add a variable named MyVariable1 to the newly created folder "MyDevice"
  let variable1 = 1
  // emulate variable1 changing every 500 ms
  setInterval(() => (variable1 += 1), 500)
  // Note that we haven't specified a NodeId for the variable. The server will
  // automatically assign a new nodeId for us.
  namespace.addVariable({
    componentOf: device,
    browseName: 'MyVariable1',
    dataType: 'Double',
    value: {
      get: () => new Variant({ dataType: DataType.Double, value: variable1 }),
    },
  })
  // _"start the server"
})()
