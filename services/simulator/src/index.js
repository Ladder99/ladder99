// simulator
// simulates a device

//. for now just an opc server, but have plugins for diff devices later

// import { Simulator } from './opc.js'
import { Simulator } from './mqtt.js'

const simulator = new Simulator()
simulator.start()
