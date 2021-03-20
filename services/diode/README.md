# Data diode

The data diode is based on a project by Marcel Maatkamp - it uses RabbitMQ and a Java application to transfer data via a one-way UDP connection. The original paper from 2016 is [here](https://arxiv.org/abs/1602.07467) and GitHub repo is [here](https://github.com/marcelmaatkamp/rabbitmq-applications/tree/master/application/datadiode).

RabbitMQ uses a protocol called AMQP (Advanced Message Queuing Protocol), which is similar to MQTT, but allows different topologies:

![rabbitmq](design/rabbitmq.png)

UDP has limited packet size (standard is 1500 bytes), so data must be chopped up by a cutter and reassembled on the other side:

![diode1](design/diode1.jpg)

Data can also be encrypted before being cut up:

![diode2](design/diode2.jpg)

The complete pipeline - the X's are exchanges (input ports) - the green X is an unencrypted exchange:

![diode3](design/diode3.png)


## Original Readme

The original readme for the data diode is [here](code/application/datadiode), slightly updated. 


## Starting the RabbitMQ queues

Edit your `/etc/hosts` with `sudo nano /etc/hosts`, and add the line:

    127.0.0.1 rabbitred rabbitblack nodered

Bring up the RabbitMQ queues -

    just rabbit

<!-- 
old - 
    cd services/diode/code/application/datadiode/contrib/docker
    docker-compose up
-->

Visit the RabbitMQ management consoles here (user guest, pw guest) - http://rabbitblack/#/exchanges and http://rabbitred/#/exchanges.

Publish and receive some data -

    cd services/diode/code/application/datadiode/contrib/nodejs
    npm install  # just need to do once
    node src/send.js

You can see the message go by in the RabbitMQ console - http://rabbitblack/#/queues/%2F/hello. 

It's not yet setup to pass through the diode though.

Node-red

    http://localhost:1880

LDAP

    https://rabbitblack/#/
    https://rabbitred/#/


## Starting the Diode Receiver and Sender

Run black and red Java applications - these listen to the RabbitMQ queues and manipulate the data - 

    just black

in another terminal

    just red

