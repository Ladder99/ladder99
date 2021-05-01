#!/bin/bash

# run the adapter simulator
/usr/bin/ruby /etc/mtconnect/simulator/run_scenario.rb -l \
  /etc/mtconnect/simulator/VMC-3Axis-Log.txt &

# run the agent with sample agent config
cd /etc/mtconnect/simulator && agent debug agent.cfg
