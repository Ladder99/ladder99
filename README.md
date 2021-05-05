# Ladder99 MTConnect System

This project transfers data from factory devices to a database and end-user visualizations. 

MTConnect standardizes factory device data flow - it was designed by UC Berkeley, Georgia Institute of Technology, and Sun Microsystems in 2008. 


## Goals

- Connect factory devices to database and visualizations
- Use MTConnect Adapter, Agent, Application scheme
- Enforce one-way dataflow via a data diode
- Secure communication between devices via encrypted UDP transmission


## Architecture

### Data flow

![arch](design/architecture.dot.svg)

MQTT is a simple publish/subscribe message protocol. Messages from factory devices go to an MQTT Broker (Mosquitto). PLC4X communicates with old machines via proprietary protocols and translates them to MQTT (correct?). 

Our MTConnect Adapter (a NodeJS program) subscribes and listens to those messages, translates them to SHDR (Simple Hierarchical Data Representation, eg "2021-02-28T02:40:00|key|value"), and sends them on to the MTConnect Agent (cppagent) via an optional one-way data diode (Java + RabbitMQ). 

An MTConnect Application then consumes the data as XML over HTTP, and feeds it to a database and visualizer. 

For more on the data diode, see the service [here](services/diode).


## Installation

Clone this repo

    git clone https://github.com/Ladder99/mtconnect

or if using ssh (can set up so don't need to enter pw all the time)

    git clone git@github.com:Ladder99/mtconnect.git

then

    cd mtconnect

You can see all the Mac/Linux shell commands available with

    tree sh

### Desktop (Mac/Linux)

Install Docker, Node, jq, and Python3 from their installers. 

Install all other dependencies with

    sh/install/apps
    sh/install/deps

### Raspberry pi

Install Docker and other dependencies -

    sh/install/docker
    sh/install/apps
    sh/install/deps


## Developing

The device models are defined in `models`, eg the ccs-pa model has model.yaml, inputs.yaml, outputs.yaml, and types.yaml. 

The device instances are defined in the `setups` folder, eg the `demo` setup has a list of instances in the devices subfolder there. Edit these as needed.

Then generate the `setups/demo/volumes/agent/devices.xml` and `setups/demo/docker/docker-compose.yaml` files (former partially implemented, latter not implemented yet - hand-edit) -

    sh/setup/compile pi

Then copy the relevant data files into named volumes - 

    sh/adapter/copy pi
    sh/agent/copy pi

Then build the multiarchitecture Docker images - this will also push them to our Ladder99 Docker Hub. This can be done on another machine, as it can take a few hours if starting from scratch -

    sh/adapter/build
    sh/agent/build

Then start the services with -

    sh/setups/run pi
    sh/setups/run pi simulations
    sh/setups/run pi application
    sh/setups/run pi base simulations application

You can watch the simulation send mqtt messages to the brokers through to the adapter and then onto the agent via shdr messages. 

To see the xml the agent generates visit

    localhost:5000/current

If you're running the setup on a pi, goto something like this -

    192.168.0.109:5000/current 

To replay some more mqtt messages,

    sh/setup/replay

(not yet working)


## Documentation

Serve the docs for development with

    sh/docs/serve

Build and deploy the docs with

    sh/docs/build
    sh/docs/deploy

then visit https://ladder99-mtconnect.web.app/

