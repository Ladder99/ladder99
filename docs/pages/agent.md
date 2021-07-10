# Agent

Ladder99 Agent is a Docker image of the MTConnect Agent, which receives data from a device adapter, fits key-value pairs into an xml tree, and serves output as XML or HTML.

See https://github.com/mtconnect/cppagent

## Running

Start the Agent with the default CNC simulation -

    docker run --name agent -it --init --rm -p 5000:5000 \
        --pull always ladder99/agent:latest

then view the output in your browser at http://localhost:5000 or http://raspberrypi.local:5000 or similar.

To run with your own configuration, point the Agent to a folder containing your agent.cfg file etc, e.g.

    docker run --name agent -it --init --rm -p 5000:5000 \
        -v $(pwd)/setups/ccs-pa/volumes/agent:/data/agent \
        --workdir /data/agent \
        --pull always ladder99/agent:latest agent debug

## Styles

The HTML output is defined in the styles folder, using XSL to transform the default XML output. The XSL is adapted/extended from https://github.com/TrakHound/MTConnect-Agent-Stylesheet.

## XML

To see the original XML output, you can omit or comment out the files sections of your agent.cfg file.

<!-- add image -->
