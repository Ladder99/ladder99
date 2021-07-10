# Agent

Ladder99 Agent is a Docker image of the MTConnect Agent, which receives data from one or more device Adapters, fits the key-value data into an XML tree, and serves output as XML or HTML.

## Default Setup

To start the Agent with the default simulation of a 3-axis VMC CNC machine -

    docker run --name agent -it --init --rm -p 5000:5000 \
        --pull always ladder99/agent:latest

then view the output in your browser at http://localhost:5000 or http://raspberrypi.local:5000 or similar.

![agent](_images/agent.jpg)

## Custom Setup

To run with your own custom setup, point the Agent to a folder containing an agent.cfg file etc, e.g.

    docker run --name agent -it --init --rm -p 5000:5000 \
        -v $(pwd)/setups/ccs-pa/volumes/agent:/data/agent \
        --workdir /data/agent \
        --pull always ladder99/agent:latest agent debug

## XML

To see the original XML output, you can omit or comment out the files sections of the agent.cfg file.

<!-- add image -->

## Styles

The HTML output is defined in the styles folder, using XSL to transform the default XML output. Our XSL is adapted/extended from https://github.com/TrakHound/MTConnect-Agent-Stylesheet.

## Source

The MTConnect Agent is an open source C++ application - see https://github.com/mtconnect/cppagent.
