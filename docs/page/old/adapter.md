## Running

You can run some sample data with

```bash
cd ladder99
git clone https://github.com/Ladder99/setup-development setups/development
l99 use development/ccs-pa
l99 start adapter agent mosquitto play
```

then visit http://localhost:5000/current.

<!-- ## Diagram

![](../_images/adapter.png) -->


<!-- ### Compiler

The compiler gathers the device.xml templates from the different models specified in a setup.yaml file. It removes Inputs, source attributes, substitutes $deviceId, etc. - then combines the resulting xml data into one devices.xml file. -->


<!-- ## Custom Setup

To run with your own custom setup, point the Agent to a folder containing your agent.cfg configuration file, e.g.

    docker run -it --init --rm -p 5000:5000 \
        -v $(pwd)/setups/test/print-apply/volumes/agent:/data/agent \
        --workdir /data/agent \
        ladder99/agent:latest agent debug 
        
-->

