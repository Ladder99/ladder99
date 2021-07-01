# Introduction

## Goals

- Connect factory devices to database and visualizations
- Use MTConnect Adapter, Agent, Application scheme
- Enforce one-way dataflow via a data diode

## Architecture

![img](../../design/architecture.dot.svg)

MQTT is a publish/subscribe message protocol. Messages from factory devices go to an MQTT Broker (Mosquitto).

<!-- PLC4X communicates with old machines via proprietary protocols and translates them to MQTT (correct?).  -->

Our MTConnect Adapter subscribes and listens to those messages, translates them to SHDR (Simple Hierarchical Data Representation, eg "2021-02-28T02:40:00|key|value"), and sends them on to the MTConnect Agent.

<!-- via an optional one-way data diode (Java + RabbitMQ) -->

Our MTConnect Application then consumes the data as XML or JSON over HTTP, and feeds it to a database and visualizer.

<!-- For more on the data diode, see the service [here](services/diode). -->
