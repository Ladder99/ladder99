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

![arch](docs/architecture.dot.svg)

Messages from factory devices go to an MQTT Broker (Aedes, a NodeJS program). PLC4X communicates with old machines via proprietary protocols and translates them to MQTT (correct?). MQTT is a simple publish/subscribe message protocol.

Our MTConnect Adapter (a NodeJS program) subscribes and listens to those messages, translates them to SHDR (Simple Hierarchical Data Representation, eg "2021-02-28T02:40:00|key|value"), and sends them on to a one-way diode (Java + RabbitMQ). 

The diode receiver then sends them on to an MTConnect Agent (C++/cppagent), and an MTConnect Application consumes the data as XML over HTTP, and feeds it to a database and visualizer. 


### Data diode

The data diode uses RabbitMQ and a Java application to transfer data via a one-way UDP connection. 

RabbitMQ uses a protocol called AMQP (Advanced Message Queuing Protocol), which is similar to MQTT, but allows different topologies:

![rabbitmq](docs/rabbitmq.png)

UDP has limited packet size, so data must be chopped up by a cutter and reassembled on the other side:

![diode1](docs/diode1.jpg)

Data can also be encrypted before being cut up:

![diode2](docs/diode2.jpg)

The complete pipeline - the X's are exchanges (input ports) - the green X is an unencrypted exchange:

![diode3](docs/diode3.png)

[2016 paper](https://arxiv.org/abs/1602.07467) and [original source code](https://github.com/marcelmaatkamp/rabbitmq-applications/tree/master/application/datadiode)


## Usage

Run the system with

    docker-compose up
    
this will start plc4x, the mqtt broker, adapter, agent, diode, application, database, and visualizer - and send some test messages from a simulated device - 

In the terminal you should get output like this -

    $ docker-compose up --remove-orphans
    Removing orphan container "diode"
    Creating broker ... done
    Creating adapter ... done
    Creating device  ... done
    Attaching to broker, adapter, device
    broker     | 2021-03-03T07:04:53: mosquitto version 2.0.7 starting
    adapter    |
    adapter    | > ladder99-adapter@0.1.0 start
    adapter    | > node src/index.js
    adapter    |
    device     |
    device     | > ladder99-device@0.1.0 start
    device     | > node src/index.js
    device     |
    device     | Device
    device     | Simulates a device sending MQTT messages.
    device     | ------------------------------------------------------------
    adapter    | MTConnect Adapter
    device     | Connecting to MQTT broker on { host: 'broker', port: 1883 }
    adapter    | Subscribes to MQTT topics, transforms to SHDR, sends to diode.
    adapter    | ----------------------------------------------------------------
    adapter    | Connecting to MQTT broker on { host: 'broker', port: 1883 } ...
    adapter    | Hit ctrl-c to stop adapter.
    device     | Publishing messages...
    device     | Topic l99/ccs/evt/status: {"connection":"online","state":400,"prog...
    device     | Topic l99/ccs/evt/read: [{"address":"%Q0.1","keys":["OUT2","outp...
    device     | Topic l99/ccs/evt/read: {"address":"%Q0.7","keys":["OUT8","outpu...
    device     | Closing MQTT connection...
    broker     | 2021-03-03T07:04:53: Config loaded from /mosquitto/config/mosquitto.conf.
    broker     | 2021-03-03T07:04:53: Opening ipv4 listen socket on port 1883.
    broker     | 2021-03-03T07:04:53: mosquitto version 2.0.7 running
    broker     | 2021-03-03T07:04:56: New connection from 172.29.0.4:47774 on port 1883.
    broker     | 2021-03-03T07:04:56: New client connected from 172.29.0.4:47774 as mqttjs_4193fb70 (p2, c1, k60).
    broker     | 2021-03-03T07:04:56: No will message specified.
    broker     | 2021-03-03T07:04:56: Sending CONNACK to mqttjs_4193fb70 (0, 0)
    broker     | 2021-03-03T07:04:56: Received PUBLISH from mqttjs_4193fb70 (d0, q0, r0, m0, 'l99/ccs/evt/status', ... (177 bytes))
    broker     | 2021-03-03T07:04:56: Received PUBLISH from mqttjs_4193fb70 (d0, q0, r0, m0, 'l99/ccs/evt/read', ... (115 bytes))
    broker     | 2021-03-03T07:04:56: Received PUBLISH from mqttjs_4193fb70 (d0, q0, r0, m0, 'l99/ccs/evt/read', ... (56 bytes))
    broker     | 2021-03-03T07:04:56: Received DISCONNECT from mqttjs_4193fb70
    broker     | 2021-03-03T07:04:56: Client mqttjs_4193fb70 disconnected.
    broker     | 2021-03-03T07:04:56: New connection from 172.29.0.3:40256 on port 1883.
    adapter    | Connected to MQTT broker on { host: 'broker', port: 1883 } mqtt://broker:1883
    adapter    | Subscribing to MQTT topics...
    adapter    | Subscribing to topic l99/ccs/evt/status...
    adapter    | Subscribing to topic l99/ccs/evt/read...
    adapter    | Listening for MQTT messages...
    device     | npm notice
    device     | npm notice New minor version of npm available! 7.5.3 -> 7.6.0
    device     | npm notice Changelog: <https://github.com/npm/cli/releases/tag/v7.6.0>
    device     | npm notice Run `npm install -g npm@7.6.0` to update!
    device     | npm notice
    device exited with code 0
    ^C
    Gracefully stopping... (press Ctrl+C again to force)
    Stopping adapter ... done
    Stopping broker  ... done


## Running the diode

Edit your `/etc/hosts` with `sudo nano /etc/hosts`, and add the line:

    127.0.0.1 rabbitred rabbitblack nodered

Bring up all the services -

    cd src/diode/application/datadiode/contrib/docker
    docker-compose up

Visit the RabbitMQ management consoles here (user guest, pw guest) -

    http://rabbitblack/#/exchanges
    http://rabbitred/#/exchanges

Publish and receive some data -

    cd src/diode/application/datadiode/contrib/nodejs
    npm install  # just need to do once
    node src/send.js

You can see the message go by in the RabbitMQ consoles -



Node-red

    http://localhost:1880

LDAP

    https://rabbitblack/#/
    https://rabbitred/#/
