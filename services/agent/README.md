# ladder99-agent

The agent is a C++ program (cppagent) that receives SHDR text data, fits the key-value pairs into a Devices.xml tree, and outputs the xml to HTML, at e.g. localhost:5000. 

Note: the Dockerfile copies the styles folder into /etc/mtconnect - it's used by the default agent config and Ruby simulator.

See setups folder for configurations, eg

- setups/pi/volumes/agent/agent.cfg
- setups/pi/docker/docker-compose.yaml
