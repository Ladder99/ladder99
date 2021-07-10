# Architecture

Data flows from devices through the Adapter, Agent, and Application to the Database and Visualizer.

![img](../../design/architecture.dot.svg)

The Adapter polls or subscribes to messages from devices, and translates them to SHDR (Simple Hierarchical Data Representation), eg "2021-02-28T02:40:00|key|value", which it sends on to the Agent.

The Agent fits that data into an XML tree representing the device structures. This XML can be viewed in the browser, or transformed into HTML.

The Application then consumes the XML and feeds it to the Database and Visualizer.

<!-- MQTT is a publish/subscribe message protocol. Messages from factory devices go to an MQTT Broker (Mosquitto). -->
<!-- via an optional one-way data diode (Java + RabbitMQ) -->
