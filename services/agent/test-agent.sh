#!/bin/bash

# run the adapter simulator
#/usr/bin/ruby /etc/mtconnect/adapter/run_scenario.rb -l \
#  /etc/mtconnect/adapter/VMC-3Axis-Log.txt &
/usr/bin/ruby /etc/mtconnect/simulator/run_scenario.rb -l \
  /etc/mtconnect/simulator/VMC-3Axis-Log.txt &

# run the agent with sample agent config
# /usr/local/bin/agent debug /etc/mtconnect/adapter/agent.cfg
/usr/local/bin/agent debug /etc/mtconnect/simulator/agent.cfg
