// simulator
// simulates a device

//. have plugins for diff devices

// import { Simulator } from './opc.js'
// import { Simulator } from './mqtt.js'
import { Simulator } from './modbus.js'

const simulator = new Simulator()
simulator.start()
