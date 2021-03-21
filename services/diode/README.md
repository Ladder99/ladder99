# Data diode

The data diode is based on a project by Marcel Maatkamp - it uses RabbitMQ and a Java application to transfer data via a one-way UDP connection. The original paper from 2016 "Unidirectional Secure Information Transfer via RabbitMQ" is [here](https://arxiv.org/abs/1602.07467) and GitHub repo is [here](https://github.com/marcelmaatkamp/rabbitmq-applications/tree/master/application/datadiode).

RabbitMQ uses a protocol called AMQP (Advanced Message Queuing Protocol), which is similar to MQTT, but allows different topologies:

![rabbitmq](design/rabbitmq.png)

UDP has limited packet size (standard is 1500 bytes), so data must be chopped up by a cutter and reassembled on the other side:

![diode1](design/diode1.jpg)

Data can also be encrypted before being cut up:

![diode2](design/diode2.jpg)

The complete pipeline - the X's are exchanges (input ports) - the green X is an unencrypted exchange:

![diode3](design/diode3.png)


## Installing

Edit your `/etc/hosts` with `sudo nano /etc/hosts`, and add the line:

    127.0.0.1 rabbitred rabbitblack nodered

(can this be done in a docker-compose setup?)


## Starting the RabbitMQ queues

Bring up the RabbitMQ queues -

    just rabbit

Visit the RabbitMQ management consoles here (user guest, pw guest) -

- http://rabbitblack/#/exchanges 
- http://rabbitred/#/exchanges

Publish and receive some data - this runs the nodejs program [here](code/application/datadiode/contrib/nodejs/src/send.js).

    just send

You can see the message go by in the RabbitMQ console - http://rabbitblack/#/queues/%2F/hello. 

The diode is not fully setup yet though - the Java programs listen to the message queues and transform it. 


## Starting the Diode Receiver and Sender

Run black and red Java applications - these listen to the RabbitMQ queues and manipulate the data - 

    just black

in another terminal

    just red

(get stuck at 97%)


## Sending data across Diode

Goto node-red and setup a timestamp feeding to an mqtt output. 

- http://nodered

This should send a timestamp across the diode. 


LDAP 

- https://rabbitblack/#/ 
- https://rabbitred/#/

(what's this for?)


## Original Readme

The original readme for the data diode is [here](code/application/datadiode), slightly updated. 


