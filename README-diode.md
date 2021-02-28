# Ladder99 Diode

Unidirectional data diode using Marcel Maatkamp's [Java/RabbitMQ datadiode](https://github.com/marcelmaatkamp/rabbitmq-applications/tree/master/application/datadiode)


## Installation

Edit /etc/hosts with `sudo nano /etc/hosts`, and add the line

    127.0.0.1 rabbitred rabbitblack nodered


## Running

Bring up all the services -

    cd javadiode/application/datadiode/contrib/docker
    docker-compose up

Visit the RabbitMQ management consoles here (user guest, pw guest) -

    http://rabbitblack/#/exchanges
    http://rabbitred/#/exchanges

Publish and receive some data -

    cd javadiode/application/datadiode/contrib/nodejs
    npm install  # just need to do once
    node src/send.js

Node-red

    http://localhost:1880

LDAP

    https://rabbitblack/#/
    https://rabbitred/#/


