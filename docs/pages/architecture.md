# Architecture

![img](../../design/architecture.dot.svg)

MQTT is a publish/subscribe message protocol. Messages from factory devices go to an MQTT Broker (Mosquitto).

The Ladder99 Adapter subscribes and listens to those messages, translates them to SHDR (Simple Hierarchical Data Representation, eg "2021-02-28T02:40:00|key|value"), and sends them on to the Ladder99 Agent.

<!-- via an optional one-way data diode (Java + RabbitMQ) -->

The Ladder99 Application then consumes the data as XML over HTTP, and feeds it to a database and visualizer.
