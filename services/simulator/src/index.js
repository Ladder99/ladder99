// simulator
// simulates a device

//. for now just an opc server, but have plugins for diff devices later

import { Simulator } from './opc.js'

const simulator = new Simulator()
simulator.start()
