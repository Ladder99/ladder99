// simulator
// simulates a device

//. for now just an opc server, but have plugins for diff devices later

// originally made this when was using mac, and didn't have access to kepware.
// now on windows, so will try using kepware demo server.

import { Simulator } from './opc.js'

const simulator = new Simulator()
simulator.start()
