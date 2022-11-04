# Sequence diagrams 

Lifecycles of Adapter plugins

## MQTT Plugin

```mermaid
sequenceDiagram

participant device as Device
participant server as MQTT Broker
participant adapter as Adapter
participant plugin as MQTT Plugin
participant cache as Cache
participant agent as Agent
participant user as User

device -->> server: register
adapter -->> plugin: init
plugin -->> server: connect
server -->> plugin: acknowledge
plugin -->> server: subscribe
device -->> server: msg
server -->> plugin: MQTT msg
plugin -->> cache: set(key, value)
cache -->> agent: SHDR string
agent -->> user: XML <DataItems />

```

## Kepware OPC Plugin

```mermaid
sequenceDiagram

participant device as Device
participant server as Kepware
participant adapter as Adapter
participant plugin as OPC Plugin
participant cache as Cache
participant agent as Agent
participant user as User

device -->> server: register
adapter -->> plugin: init
plugin -->> server: query
server -->> plugin: OPC msg
plugin -->> cache: set(key, value)
cache -->> agent: SHDR string
agent -->> user: XML <DataItems />

```

## ASC CPC Plugin

```mermaid
sequenceDiagram

participant device as ASC Econoclave
participant server as ASC CPC
participant adapter as Adapter
participant plugin as CPC Plugin
participant cache as Cache
participant agent as Agent
participant user as User

device -->> server: register
adapter -->> plugin: init
plugin -->> server: query
server -->> plugin: CPC msg
plugin -->> cache: set(key, value)
cache -->> agent: SHDR string
agent -->> user: XML <DataItems />

```

See https://mermaid-js.github.io/mermaid/#/sequenceDiagram

