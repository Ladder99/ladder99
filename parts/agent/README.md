<!-- get image

    docker pull raymondhub/mtconnect:v1.5 
-->

run container

    docker run -it -p 5000:5000 -p 7878:7878 raymondhub/mtconnect /bin/bash

test agent

    cd /etc/mtconnect/agent
    agent debug agent.cfg

run adapter

    cd ~/agent/cppagent/simulator
    ruby run_scenario.rb -l VMC-3Axis-Log.txt

goto

    http://localhost:5000/current

check log data

    cat /var/log/mtc_agent.log



    "start": "/Users/bburns/Desktop/cppagent-1.6.0.7/build/agent/agent run src/agent/agent.cfg",
    "start-debug": "/Users/bburns/Desktop/cppagent-1.6.0.7/build/agent/agent debug src/agent/agent.cfg"

