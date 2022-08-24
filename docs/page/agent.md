# Agent

The **MTConnect Agent** receives data from one or more device Adapters and writes the data to an XML tree. This XML can be consumed by other applications, or displayed in a browser as an HTML webpage.


## Simulation

To start the Agent with the default simulation of a 3-axis CNC machine -

    docker run -it --init --rm -p 5000:5000 ladder99/agent:latest

then view the output in your browser at http://localhost:5000.

![](_images/agent-html_1200.jpg)


## Custom Setup

To run with your own custom setup, point the Agent to a folder containing your agent.cfg configuration file, e.g.

    docker run -it --init --rm -p 5000:5000 \
        -v $(pwd)/setups/test/print-apply/volumes/agent:/data/agent \
        --workdir /data/agent \
        ladder99/agent:latest agent debug


<!-- ## XML Output

To see the original XML output, you can omit or comment out the files sections of the agent.cfg file -

![](_images/agent-xml.jpg) -->


<!-- ## HTML Styles

The HTML output is defined by the XSL and CSS in the [pipeline/agent/styles folder](https://github.com/Ladder99/ladder99/tree/main/pipeline/agent/styles), which transforms the default XML output. -->


## Agent Source

The MTConnect Agent is an open source C++ application. To learn more about it, see https://github.com/mtconnect/cppagent.

