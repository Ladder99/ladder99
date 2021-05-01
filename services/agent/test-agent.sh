#!/bin/bash

# run the adapter simulator
/usr/bin/ruby /etc/mtconnect/adapter/run_scenario.rb -l \
  /etc/mtconnect/adapter/VMC-3Axis-Log.txt &

# run the agent with sample agent config
/usr/local/bin/agent run /etc/mtconnect/adapter/agent.cfg
