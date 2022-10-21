// opc simulator

// the endpoint urn of our server will be
//   opc.tcp://<hostname>:4334/UA/LittleServer

// adapted from https://github.com/node-opcua/node-opcua

const os = require('os')
const { OPCUAServer, Variant, DataType, StatusCodes } = require('node-opcua') // https://github.com/node-opcua/node-opcua

//

export class Simulator {
  //
  async start() {
    console.log(`OPC server create...`)
    const server = new OPCUAServer({
      port: 4334, // the port of the listening socket of the server
      resourcePath: '/UA/LittleServer', // this path will be added to the endpoint resource name
      buildInfo: {
        productName: 'SampleServer1',
        buildNumber: '7658',
        buildDate: new Date(2022, 9, 21),
      },
    })

    console.log('OPC server initialize...')
    await server.initialize()

    // addressSpace is used to customize the object model that our server
    // will expose to the external world.
    const addressSpace = server.engine.addressSpace
    const namespace = addressSpace.getOwnNamespace()

    // add a new object into the objects folder
    console.log(`OPC server add MyDevice...`)
    const device = namespace.addObject({
      organizedBy: addressSpace.rootFolder.objects,
      browseName: 'MyDevice',
    })

    // add a variable named MyVariable1 to the newly created folder "MyDevice".
    // adding a read-only variable inside the server namespace requires
    // only a getter function. this function returns a Variant containing the
    // value of the variable to scan.
    // note that we haven't specified a NodeId for the variable - the server will
    // automatically assign a new nodeId for us.
    let variable1 = 1
    // emulate variable1 changing every 500 ms
    setInterval(() => (variable1 += 1), 500)
    console.log(`OPC server add MyVariable1...`)
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
    console.log(`OPC server add MyVariable2...`)
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

    // publish a free memory variable
    console.log(`OPC server add FreeMemory...`)
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

    // publish a motion alarm variable
    //. this will use a recording for simulation
    let nodeId = 'ns=1;s=B3:5'
    console.log(`OPC server add ${nodeId}...`)
    namespace.addVariable({
      componentOf: device,
      nodeId,
      browseName: 'B4433-motion-alarm',
      dataType: 'Double',
      value: {
        get: () => new Variant({ dataType: DataType.Double, value: 1.1 }), //.
      },
    })

    // publish an operator variable
    //. this will use a recording for simulation
    nodeId = 'ns=1;s=Operator'
    console.log(`OPC server add ${nodeId}...`)
    namespace.addVariable({
      componentOf: device,
      nodeId,
      browseName: 'Operator',
      dataType: 'String',
      value: {
        get: () =>
          new Variant({ dataType: DataType.String, value: 'Amanda Davis' }), //.
      },
    })

    // start the server
    console.log(`OPC server start...`)
    server.start(function () {
      console.log('OPC server is now listening ... (press CTRL+C to stop)')
      console.log('OPC server port', server.endpoints[0].port)
      // display endpoint url
      const endpointUrl =
        server.endpoints[0].endpointDescriptions()[0].endpointUrl
      console.log('OPS server primary endpoint is', endpointUrl)
    })
  }
}

// helpers

// returns the percentage of free memory on the running machine
function available_memory() {
  // var value = process.memoryUsage().heapUsed / 1000000;
  const percentageMemUsed = (os.freemem() / os.totalmem()) * 100.0
  return percentageMemUsed
}
