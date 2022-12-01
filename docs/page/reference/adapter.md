# Adapter

## About

The Adapter reads data from a device and translates it into SHDR, a simple key-value text representation, then sends it on to the Agent.

## How it works

### Adapter

The Adapter reads the setup.yaml, iterates over the device configs, each of which includes one or more sources. Each source can use a different driver to read data from a device.

### Driver

A Driver reads data from a device, by either subscribing to it, polling it, or communicating with it in some way - then adds that data to a key-value cache. 

### Cache

The Cache is a key-value store in the Adapter that can execute code when a value changes. This can write data to another cache location, or write SHDR data to the server. When a cache value is written to, it will recursively call the functions until all are complete, or some limit is reached.

### Server

Each Adapter has a TCP server which talks to the Agent. It sends SHDR data which the Agent splits up and applies to the model defined by the agent.xml file.

### MQTT Provider/Subscriber

For MQTT, an MqttProvider can subscribe to an external MQTT Broker, then an MqttSubscriber can subscribe to certain messages from it. 

